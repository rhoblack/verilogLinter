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
  protected readyPromise: Promise<void>;

  constructor(name: string) {
    this.name = name;
    this.outputChannel = vscode.window.createOutputChannel(`Verilog Formatter Debug (${name})`);

    this.configListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`verilogLinter.formatting.${name}`)) {
        this.readyPromise = Promise.resolve(this.updateConfig());
      }
    });

    this.readyPromise = Promise.resolve();
  }

  protected abstract updateConfig(): Promise<void> | void;

  public provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.readyPromise;
        
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
                 if (expandedExe === 'verible' || expandedExe === 'verible-verilog-format') {
                   msg += " Please check your settings or ensure it is installed.";
                 }
                 msg += " Please set the absolute path in Settings.";
                 vscode.window.showErrorMessage(msg);
                 return resolve([]);
              }
              // For other formatting errors (like syntax errors), don't show a popup if we got no output
              // This prevents annoying popups while typing/saving incomplete code.
              if (!stdout) {
                  this.outputChannel.appendLine(`[Format Error] Formatter exited with error and no output. This is likely a syntax error in the source file.`);
              } else {
                  vscode.window.showErrorMessage(`${this.name} formatter failed. Check 'Verilog Formatter Debug (${this.name})' output channel for details.`);
              }
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
      } catch (err) {
        this.outputChannel.appendLine(`[Format Internal Error] ${err}`);
        resolve([]);
      }
    });
  }

  protected abstract getFormatArguments(baseArgs: string[], document: vscode.TextDocument, options: vscode.FormattingOptions): string[];

  public dispose() {
    this.configListener.dispose();
  }
}
