import * as vscode from 'vscode';
import BaseFormatter from './BaseFormatter';

export default class IstyleFormatter extends BaseFormatter {
  constructor() {
    super('istyle');
  }

  protected override updateConfig() {
    const configuration = vscode.workspace.getConfiguration('verilogLinter.formatting.istyle');
    this.config.executable = configuration.get<string>('executable', 'istyle-verilog-formatter');
    this.config.arguments = configuration.get<string>('arguments', '');
  }

  protected override getFormatArguments(baseArgs: string[], document: vscode.TextDocument, options: vscode.FormattingOptions): string[] {
    const args = [...baseArgs];
    
    // iStyle specific arguments based on vscode.FormattingOptions
    if (options.insertSpaces) {
      args.push(`--indent=space=${options.tabSize}`);
    } else {
      args.push('--indent=tab');
    }

    return args;
  }
}
