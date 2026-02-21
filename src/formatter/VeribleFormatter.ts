import * as vscode from 'vscode';
import BaseFormatter from './BaseFormatter';

export default class VeribleFormatter extends BaseFormatter {
  constructor() {
    super('verible');
  }

  protected override updateConfig() {
    const configuration = vscode.workspace.getConfiguration('verilogLinter.formatting.verible');
    this.config.executable = configuration.get<string>('executable', 'verible-verilog-format');
    this.config.arguments = configuration.get<string>('arguments', '');
  }

  protected override getFormatArguments(baseArgs: string[], document: vscode.TextDocument, options: vscode.FormattingOptions): string[] {
    const args = [...baseArgs];
    
    // Verible specific indentation rules based on custom user setting
    const indentSpaces = vscode.workspace.getConfiguration('verilogLinter.formatting').get<number>('indentationSpaces', 4);
    args.push(`--indentation_spaces=${indentSpaces}`);

    // Write out straight to stdout by using '-'
    args.push('-');
    return args;
  }
}
