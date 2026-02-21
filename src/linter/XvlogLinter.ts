import * as vscode from 'vscode';
import * as child from 'child_process';
import * as path from 'path';
import BaseLinter from './BaseLinter';

export default class XvlogLinter extends BaseLinter {
  private configuration!: vscode.WorkspaceConfiguration;

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    super('xvlog', diagnosticCollection);
  }

  protected override updateConfig() {
    this.configuration = vscode.workspace.getConfiguration('verilogLinter.linting.xvlog');
    this.config.arguments = this.configuration.get<string>('arguments', '');
    const paths = this.configuration.get<string[]>('includePath', []);
    this.config.includePath = this.resolveIncludePaths(paths);
  }

  protected lint(doc: vscode.TextDocument) {
    let args: string[] = [];
    
    // Add nolog to prevent creating xvlog.log and xvlog.pb files on linting
    args.push('--nolog');
    
    if (doc.languageId === 'systemverilog') {
        args.push('--sv');
    }

    // Add include paths
    args = args.concat(this.config.includePath.map((p: string) => `-i "${p}"`));
    // Add common arguments
    if (this.config.arguments) {
      args.push(this.config.arguments);
    }
    // Add the target file
    args.push(`"${doc.uri.fsPath}"`);

    const command = `xvlog ${args.join(' ')}`;
    const cwd = this.getWorkingDirectory(doc);

    child.exec(
      command,
      { cwd },
      (_error: child.ExecException | null, stdout: string, _stderr: string) => {
        const diagMap = new Map<string, vscode.Diagnostic[]>();
        // Xilinx xvlog messages typically look like:
        // ERROR: [VRFC 10-2263] port connection required for port 'foo' [/path/to/file.v:12]
        // WARNING: [VRFC 10-2342] some warning [/path/to/file.v:34]

        const regex = /(ERROR|WARNING):\s*\[(.*?)\]\s*(.*?)\s*\[(.*):(\d+)\]/g;
        let match;

        while ((match = regex.exec(stdout)) !== null) {
          const kind = match[1]; // 'ERROR' or 'WARNING'
          const fileRaw = match[4];
          const lineNum = Number(match[5]);
          const message = `[${match[2]}] ${match[3].trim()}`;
          
          const severity = (kind === 'ERROR') ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
          const fsPath = path.isAbsolute(fileRaw) ? fileRaw : path.resolve(cwd, fileRaw);

          const rangeLine = Math.max(0, lineNum - 1);
          let startCol = 0;
          let endCol = 1;

          if (rangeLine < doc.lineCount) {
            const textLine = doc.lineAt(rangeLine);
            startCol = textLine.firstNonWhitespaceCharacterIndex;
            endCol = textLine.text.length;

            // Optional: try to find exact token if "near '...'" is in the message
            const nearMatch = message.match(/near '([^']+)'/);
            if (nearMatch) {
              const idx = textLine.text.indexOf(nearMatch[1]);
              if (idx >= 0) {
                startCol = idx;
                endCol = idx + nearMatch[1].length;
              }
            }
          }

          const range = new vscode.Range(new vscode.Position(rangeLine, startCol), new vscode.Position(rangeLine, endCol));
          
          const d = new vscode.Diagnostic(range, message, severity);
          d.source = 'xvlog';

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
