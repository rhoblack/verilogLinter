import * as vscode from 'vscode';
import * as child from 'child_process';
import * as path from 'path';
import BaseLinter from './BaseLinter';

export default class XceliumLinter extends BaseLinter {
  private configuration!: vscode.WorkspaceConfiguration;

  private uvmSupport: boolean = false;

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    super('xcelium', diagnosticCollection);
  }

  protected override updateConfig() {
    this.configuration = vscode.workspace.getConfiguration('verilogLinter.linting.xcelium');
    this.config.executable = this.configuration.get<string>('executable', 'xrun');
    this.config.arguments = this.configuration.get<string>('arguments', '-compile -sv');
    this.uvmSupport = this.configuration.get<boolean>('uvmSupport', false);
    const paths = this.configuration.get<string[]>('includePath', []);
    this.config.includePath = this.resolveIncludePaths(paths);
  }

  protected lint(doc: vscode.TextDocument) {
    let args: string[] = [];
    
    // Add UVM support
    if (this.uvmSupport) {
        args.push('-uvm');
    }
    
    // Add include paths
    args = args.concat(this.config.includePath.map((p: string) => `-INCDIR ${p}`));
    // Add common arguments
    if (this.config.arguments) {
      args.push(this.config.arguments);
    }
    // Add the target file
    args.push(`"${doc.uri.fsPath}"`);

    const exe = this.config.executable || 'xrun';
    const command = `${exe} ${args.join(' ')}`;
    const cwd = this.getWorkingDirectory(doc);

    child.exec(
      command,
      { cwd },
      (_error: child.ExecException | null, stdout: string, _stderr: string) => {
        if (_error && ((_error as any).code === 127 || _stderr.includes('command not found') || _error.message.includes('ENOENT'))) {
          vscode.window.showErrorMessage(`Xcelium linter ('${exe}') not found. Please set 'verilogLinter.linting.xcelium.executable' to the absolute path in Settings.`);
          return;
        }

        const diagMap = new Map<string, { uri: vscode.Uri; diags: vscode.Diagnostic[] }>();
        // Cadence messages typically look like:
        // xmvlog: *E,ERR (file.v, 12|34): syntax error.
        // xmvlog: *W,WARN (file.v, 12|34): warning MSG.

        const regex = /xmvlog:\s*\*([EW]),.*? \((.*?),(\d+)\|(\d+)\):\s*(.*)/g;
        let match;
        
        const output = `${stdout}\n${_stderr}`;

        while ((match = regex.exec(output)) !== null) {
          const kind = match[1]; // 'E' or 'W'
          const fileRaw = match[2];
          const lineNum = Number(match[3]);
          const message = match[5].trim();
          
          const severity = (kind === 'E') ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
          
          let fileUri: vscode.Uri;
          if (doc.uri.fsPath === fileRaw || doc.uri.fsPath.endsWith(fileRaw)) {
            fileUri = doc.uri;
          } else {
            const fsPath = path.isAbsolute(fileRaw) ? fileRaw : path.resolve(cwd, fileRaw);
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
          d.source = 'xcelium';

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
