import * as vscode from 'vscode';
import * as child from 'child_process';
import * as path from 'path';
import BaseLinter from './BaseLinter';

export default class XvlogLinter extends BaseLinter {
  private configuration!: vscode.WorkspaceConfiguration;

  private uvmSupport: boolean = false;
  private uvmIncludePath: string = '';
  private autoUvmPath: string | undefined;

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    super('xvlog', diagnosticCollection);
  }

  protected override updateConfig() {
    this.configuration = vscode.workspace.getConfiguration('verilogLinter.linting.xvlog');
    this.config.executable = this.configuration.get<string>('executable', 'xvlog');
    this.config.arguments = this.configuration.get<string>('arguments', '');
    this.uvmSupport = this.configuration.get<boolean>('uvmSupport', false);
    this.uvmIncludePath = this.configuration.get<string>('uvmIncludePath', '');
    
    const paths = this.configuration.get<string[]>('includePath', []);
    this.config.includePath = this.resolveIncludePaths(paths);

    this.outputChannel.appendLine(`[xvlog Config] loaded executable: '${this.config.executable}', arguments: '${this.config.arguments}', uvmSupport: ${this.uvmSupport}`);

    if (this.uvmSupport) {
        this.detectUvmPath();
    }
  }

  private detectUvmPath() {
    try {
        // 1. Check if user provided manual path
        if (this.uvmIncludePath) {
            const resolved = path.isAbsolute(this.uvmIncludePath) ? this.uvmIncludePath : path.resolve(this.uvmIncludePath);
            if (require('fs').existsSync(resolved)) {
                this.autoUvmPath = resolved;
                this.outputChannel.appendLine(`[xvlog] Using manual UVM path: ${resolved}`);
                return;
            }
        }

        // 2. Auto-detect from xvlog path
        let exePath = this.config.executable || 'xvlog';
        if (!path.isAbsolute(exePath)) {
            try {
                const result = child.execSync(`where ${exePath}`, { encoding: 'utf8' });
                exePath = result.split('\n')[0].trim();
            } catch (e) {
                this.outputChannel.appendLine(`[xvlog] 'where ${exePath}' failed, cannot auto-detect UVM path.`);
                return;
            }
        }

        if (exePath && path.isAbsolute(exePath)) {
            // Vivado structure: <VivadoRoot>/bin/xvlog.bat
            // UVM path: <VivadoRoot>/data/system_verilog/uvm_1.2
            const vivadoBin = path.dirname(exePath);
            const vivadoRoot = path.dirname(vivadoBin);
            
            this.outputChannel.appendLine(`[xvlog] detected Vivado root: ${vivadoRoot}`);

            // Try different UVM path structures (Vivado versions vary)
            const potentialPaths = [
                path.join(vivadoRoot, 'data', 'system_verilog', 'uvm_1.2'),
                path.join(vivadoRoot, 'data', 'systemverilog', 'uvm_1.2'),
                path.join(vivadoRoot, 'data', 'system_verilog', 'uvm_1.1'),
                path.join(vivadoRoot, 'data', 'systemverilog', 'uvm_1.1')
            ];

            for (const p of potentialPaths) {
                if (require('fs').existsSync(p)) {
                    this.autoUvmPath = p;
                    this.outputChannel.appendLine(`[xvlog] Auto-detected UVM path: ${p}`);
                    return;
                }
            }
        }
    } catch (e) {
        this.outputChannel.appendLine(`[xvlog] Failed to detect UVM path: ${e}`);
    }
  }

  protected lint(doc: vscode.TextDocument) {
    let args: string[] = [];
    
    // Add nolog to prevent creating xvlog.log and xvlog.pb files on linting
    args.push('--nolog');
    
    if (doc.languageId === 'systemverilog') {
        args.push('--sv');
        if (this.uvmSupport) {
            this.outputChannel.appendLine(`[xvlog] UVM support is enabled. autoUvmPath: ${this.autoUvmPath}`);
            args.push('-L', 'uvm');
            if (this.autoUvmPath) {
                args.push('-i', `"${this.autoUvmPath}"`);
                
                // Try multiple potential macro file names/locations
                const macrosPaths = [
                    path.join(this.autoUvmPath, 'src', 'uvm_macros.svh'),
                    path.join(this.autoUvmPath, 'uvm_macros.svh')
                ];
                
                let macroFound = false;
                for (const mp of macrosPaths) {
                    if (require('fs').existsSync(mp)) {
                        args.push(`"${mp}"`);
                        this.outputChannel.appendLine(`[xvlog] Added UVM macros from: ${mp}`);
                        macroFound = true;
                        break;
                    }
                }
                if (!macroFound) {
                    this.outputChannel.appendLine(`[xvlog] Warning: uvm_macros.svh not found in ${this.autoUvmPath}`);
                }
            }
        }
    }

    // Add include paths
    args = args.concat(this.config.includePath.map((p: string) => `-i "${p}"`));
    // Add common arguments
    if (this.config.arguments) {
      args.push(this.config.arguments);
    }
    // Add the target file
    args.push(`"${doc.uri.fsPath}"`);

    const exe = this.config.executable || 'xvlog';
    const command = `"${exe}" ${args.join(' ')}`;
    const cwd = this.getWorkingDirectory(doc);

    this.outputChannel.appendLine(`[xvlog Execute] running command: ${command}`);

    child.exec(
      command,
      { cwd },
      (_error: child.ExecException | null, stdout: string, _stderr: string) => {
        if (stdout || _stderr) {
            this.outputChannel.appendLine(`[xvlog Result] stdout: \n${stdout}`);
            this.outputChannel.appendLine(`[xvlog Result] stderr: \n${_stderr}`);
        }

        if (_error && ((_error as any).code === 127 || _stderr.includes('command not found') || _error.message.includes('ENOENT'))) {
          vscode.window.showErrorMessage(`Vivado xvlog ('${exe}') not found. Please set 'verilogLinter.linting.xvlog.executable' to the absolute path in Settings.`);
          return;
        }

        const diagMap = new Map<string, { uri: vscode.Uri; diags: vscode.Diagnostic[] }>();
        // Xilinx xvlog messages typically look like:
        // ERROR: [VRFC 10-2263] port connection required for port 'foo' [/path/to/file.v:12]
        // WARNING: [VRFC 10-2342] some warning [/path/to/file.v:34]

        const regex = /(ERROR|WARNING):\s*\[(.*?)\]\s*(.*?)\s*\[(.*):(\d+)\]/g;
        let match;
        
        const output = `${stdout}\n${_stderr}`;

        while ((match = regex.exec(output)) !== null) {
          const kind = match[1]; // 'ERROR' or 'WARNING'
          const fileRaw = match[4];
          const lineNum = Number(match[5]);
          const message = `[${match[2]}] ${match[3].trim()}`;
          
          const severity = (kind === 'ERROR') ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
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
