import * as vscode from 'vscode';
import * as child from 'child_process';
import * as path from 'path';
import BaseLinter from './BaseLinter';

export default class XceliumLinter extends BaseLinter {
  private configuration!: vscode.WorkspaceConfiguration;

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    super('xcelium', diagnosticCollection);
  }

  protected override updateConfig() {
    this.configuration = vscode.workspace.getConfiguration('verilog.linting.xcelium');
    this.config.arguments = this.configuration.get<string>('arguments', '-compile -sv');
    const paths = this.configuration.get<string[]>('includePath', []);
    this.config.includePath = this.resolveIncludePaths(paths);
  }

  protected lint(doc: vscode.TextDocument) {
    let args: string[] = [];
    
    // Add include paths
    args = args.concat(this.config.includePath.map((p: string) => `-INCDIR ${p}`));
    // Add common arguments
    if (this.config.arguments) {
      args.push(this.config.arguments);
    }
    // Add the target file
    args.push(`"${doc.uri.fsPath}"`);

    const command = `xrun ${args.join(' ')}`;
    const cwd = this.getWorkingDirectory(doc);

    child.exec(
      command,
      { cwd },
      (_error: child.ExecException | null, stdout: string, _stderr: string) => {
        const diagMap = new Map<string, vscode.Diagnostic[]>();
        // Cadence messages typically look like:
        // xmvlog: *E,ERR (file.v, 12|34): syntax error.
        // xmvlog: *W,WARN (file.v, 12|34): warning MSG.

        const regex = /xmvlog:\s*\*([EW]),.*? \((.*?),(\d+)\|(\d+)\):\s*(.*)/g;
        let match;

        while ((match = regex.exec(stdout)) !== null) {
          const kind = match[1]; // 'E' or 'W'
          const fileRaw = match[2];
          const lineNum = Number(match[3]);
          const message = match[5].trim();
          
          const severity = (kind === 'E') ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
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
          d.source = 'xcelium';

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
