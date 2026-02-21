import * as vscode from 'vscode';
import * as child from 'child_process';
import * as path from 'path';
import { expandEnvironmentVariables } from '../utils';

export interface FormatterConfig {
  executable: string;
  arguments: string;
}

export default abstract class BaseFormatter implements vscode.DocumentFormattingEditProvider {
  name: string;
  protected outputChannel: vscode.OutputChannel;
  protected configListener: vscode.Disposable;

  protected config: FormatterConfig = {
    executable: '',
    arguments: '',
  };

  constructor(name: string) {
    this.name = name;
    this.outputChannel = vscode.window.createOutputChannel(`Verilog Formatter Debug (${name})`);

    this.configListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`verilogLinter.formatting.${name}`)) {
        this.updateConfig();
      }
    });

    this.updateConfig();
  }

  protected abstract updateConfig(): Promise<void> | void;

  public provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    return new Promise((resolve, reject) => {
      const exe = this.config.executable || this.name;
      const expandedExe = expandEnvironmentVariables(exe);
      let args = this.config.arguments ? this.config.arguments.split(' ') : [];
      args = this.getFormatArguments(args, document, options);

      const command = `"${expandedExe}" ${args.join(' ')}`;
      const cwd = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : path.dirname(document.uri.fsPath);

      this.outputChannel.appendLine(`[Format Execute] command: ${command}`);

      const process = child.exec(
        command,
        { cwd },
        (_error: child.ExecException | null, stdout: string, _stderr: string) => {
          if (_error) {
            this.outputChannel.appendLine(`[Format Error] ${_error.message}`);
            this.outputChannel.appendLine(`[Format Stderr] ${_stderr}`);
            
            // If the command is simply not found, show user error and return empty edits.
            const isNotFound = (_error as any).code === 127 || 
                               _stderr.includes('is not recognized') || 
                               _stderr.includes('command not found') || 
                               _error.message.includes('ENOENT');

            if (isNotFound) {
               let msg = `${this.name} formatter ('${expandedExe}') not found.`;
               if (expandedExe === 'verible') {
                 msg += " (Note: The correct executable name is usually 'verible-verilog-format')";
               }
               msg += " Please set the absolute path in Settings.";
               vscode.window.showErrorMessage(msg);
               return resolve([]);
            }
            // For other formatting errors, maybe log and return empty to avoid corrupting file
            vscode.window.showErrorMessage(`${this.name} formatter failed. Check 'Verilog Formatter Debug (${this.name})' output channel for details.`);
            return resolve([]);
          }

          if (stdout) {
            const fullRange = new vscode.Range(
              document.positionAt(0),
              document.positionAt(document.getText().length)
            );
            resolve([vscode.TextEdit.replace(fullRange, stdout)]);
          } else {
            resolve([]);
          }
        }
      );

      // Write document text to stdin
      if (process.stdin) {
        process.stdin.write(document.getText());
        process.stdin.end();
      }
    });
  }

  protected abstract getFormatArguments(baseArgs: string[], document: vscode.TextDocument, options: vscode.FormattingOptions): string[];

  public dispose() {
    this.configListener.dispose();
  }
}
