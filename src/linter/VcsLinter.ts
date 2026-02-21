import * as vscode from 'vscode';
import * as child from 'child_process';
import * as path from 'path';
import BaseLinter from './BaseLinter';

export default class VcsLinter extends BaseLinter {
  private configuration!: vscode.WorkspaceConfiguration;

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    super('vcs', diagnosticCollection);
  }

  protected override updateConfig() {
    this.configuration = vscode.workspace.getConfiguration('verilog.linting.vcs');
    this.config.arguments = this.configuration.get<string>('arguments', '-lint=all -sverilog');
    const paths = this.configuration.get<string[]>('includePath', []);
    this.config.includePath = this.resolveIncludePaths(paths);
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

    const command = `vcs ${args.join(' ')}`;
    const cwd = this.getWorkingDirectory(doc);

    child.exec(
      command,
      { cwd },
      (_error: child.ExecException | null, stdout: string, _stderr: string) => {
        const diagMap = new Map<string, vscode.Diagnostic[]>();
        // VCS messages typically look like:
        // Error-[SE] Syntax error
        //   Following verilog source has syntax error :
        //   "test.v", 3: token is ';'
        // OR
        // Warning-[...] ...\n  "file", line: ...
        
        // This is a simplified regex. It might need adjustments for complex multi-line VCS errors
        const errorRegex = /(?:Error|Warning)-\[.*?\][\s\S]*?"(.*?)"\s*,\s*(\d+)/g;
        let match;

        while ((match = errorRegex.exec(stdout)) !== null) {
          const fileRaw = match[1];
          const lineNum = Number(match[2]);
          const message = match[0].trim(); // full matched block
          const isError = message.startsWith('Error');
          
          const severity = isError ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
          const fsPath = path.isAbsolute(fileRaw) ? fileRaw : path.resolve(cwd, fileRaw);

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

          const arr = diagMap.get(fsPath) ?? [];
          arr.push(d);
          diagMap.set(fsPath, arr);
        }

        this.diagnosticCollection.clear();
        for (const [fsPath, diags] of diagMap) {
          this.diagnosticCollection.set(vscode.Uri.file(fsPath), diags);
        }
      }
    );
  }
}
