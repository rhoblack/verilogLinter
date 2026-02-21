import * as vscode from 'vscode';
import * as child from 'child_process';
import * as path from 'path';
import BaseLinter from './BaseLinter';
import { expandEnvironmentVariables } from '../utils';

export default class VcsLinter extends BaseLinter {
  private configuration!: vscode.WorkspaceConfiguration;

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    super('vcs', diagnosticCollection);
  }

  protected override updateConfig() {
    this.configuration = vscode.workspace.getConfiguration('verilogLinter.linting.vcs');
    let exe = this.configuration.get<string>('executable', 'vcs');
    const vcsHome = this.configuration.get<string>('vcsHome', '');
    const args = this.configuration.get<string>('arguments', '-lint=all -sverilog');

    // 1. If vcsHome is set, use it to find VCS
    if (vcsHome) {
        const expandedHome = expandEnvironmentVariables(vcsHome);
        exe = path.join(expandedHome, 'bin', 'vcs');
    } 
    // 2. If exe is just 'vcs' (default) and VCS_HOME env var exists, try to use it
    else if (exe === 'vcs' && process.env.VCS_HOME) {
        exe = path.join(process.env.VCS_HOME, 'bin', 'vcs');
    }

    this.config.executable = expandEnvironmentVariables(exe);
    this.config.arguments = expandEnvironmentVariables(args);
    const paths = this.configuration.get<string[]>('includePath', []);
    this.config.includePath = this.resolveIncludePaths(paths);
    this.outputChannel.appendLine(`[VCS Config] loaded executable: '${this.config.executable}', arguments: '${this.config.arguments}'`);
  }

  protected lint(doc: vscode.TextDocument) {
    let args: string[] = [];
    
    // Add include paths
    args = args.concat(this.config.includePath.map((p: string) => `+incdir+${p}`));
    // Add common arguments
    if (this.config.arguments) {
      args.push(this.config.arguments);
    }
    // Add the target file
    args.push(`"${doc.uri.fsPath}"`);

    const exe = this.config.executable || 'vcs';
    const innerCommand = `"${exe}" ${args.join(' ')}`;
    // Run inside a bash login shell to ensure environment variables like VCS_HOME are sourced
    const command = `bash -lc '${innerCommand}'`;
    const cwd = this.getWorkingDirectory(doc);

    this.outputChannel.appendLine(`[VCS Execute] running command: ${command}`);

    child.exec(
      command,
      { cwd },
      (_error: child.ExecException | null, stdout: string, _stderr: string) => {
        this.outputChannel.appendLine(`[VCS Execute Callback] error: ${_error ? _error.message : 'null'}`);
        this.outputChannel.appendLine(`[VCS Execute Callback] stdout: \n${stdout}`);
        this.outputChannel.appendLine(`[VCS Execute Callback] stderr: \n${_stderr}`);

        // Only show the command not found error if we actually failed to run VCS
        // (If the output contains "Chronologic VCS", it means VCS actually ran, 
        // and the error is just from a messy bash profile script)
        const output = `${stdout}\n${_stderr}`;
        if (_error && !output.includes('Chronologic VCS') && ((_error as any).code === 127 || _stderr.includes('command not found') || _error.message?.includes('ENOENT'))) {
          vscode.window.showErrorMessage(`VCS linter ('${exe}') not found. Please set 'verilogLinter.linting.vcs.executable' to the absolute path in Settings.`);
          return;
        }

        const diagMap = new Map<string, { uri: vscode.Uri; diags: vscode.Diagnostic[] }>();
        // VCS messages typically look like:
        // Error-[SE] Syntax error
        //   Following verilog source has syntax error :
        //   "test.v", 3: token is ';'
        // OR
        // Warning-[...] ...\n  "file", line: ...
        
        // This is a simplified regex. It might need adjustments for complex multi-line VCS errors
        const errorRegex = /(?:Error|Warning)-\[.*?\][\s\S]*?"(.*?)"\s*,\s*(\d+)/g;
        let match;

        while ((match = errorRegex.exec(output)) !== null) {
          const fileRaw = match[1];
          const lineNum = Number(match[2]);
          const message = match[0].trim(); // full matched block
          const isError = message.startsWith('Error');
          
          const severity = isError ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
          
          let fileUri: vscode.Uri;
          if (doc.uri.fsPath === fileRaw || doc.uri.fsPath.endsWith(fileRaw)) {
            fileUri = doc.uri;
          } else {
            const fsPath = path.isAbsolute(fileRaw) ? fileRaw : path.resolve(cwd, fileRaw);
            // Use doc.uri.with to preserve the scheme (e.g. vscode-remote://)
            fileUri = doc.uri.with({ path: fsPath });
          }

          const rangeLine = Math.max(0, lineNum - 1);
          let startCol = 0;
          let endCol = 1;

          if (rangeLine < doc.lineCount) {
            const textLine = doc.lineAt(rangeLine);
            startCol = textLine.firstNonWhitespaceCharacterIndex;
            endCol = Math.max(startCol + 1, textLine.text.length);
          }

          const range = new vscode.Range(new vscode.Position(rangeLine, startCol), new vscode.Position(rangeLine, endCol));
          
          const d = new vscode.Diagnostic(range, message, severity);
          d.source = 'vcs';

          const uriStr = fileUri.toString();
          if (!diagMap.has(uriStr)) {
            diagMap.set(uriStr, { uri: fileUri, diags: [] });
          }
          diagMap.get(uriStr)!.diags.push(d);
        }

        this.diagnosticCollection.clear();
        for (const entry of diagMap.values()) {
          this.diagnosticCollection.set(entry.uri, entry.diags);
        }
      }
    );
  }
}
