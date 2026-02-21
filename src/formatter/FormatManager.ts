import * as vscode from 'vscode';
import BaseFormatter from './BaseFormatter';
import VeribleFormatter from './VeribleFormatter';
import IstyleFormatter from './IstyleFormatter';

export default class FormatManager {
  private subscriptions: vscode.Disposable[];
  private formatter: BaseFormatter | null = null;
  private providerRegistration: vscode.Disposable | null = null;
  
  private documentSelector: vscode.DocumentSelector = [
    { language: 'verilog', scheme: 'file' },
    { language: 'systemverilog', scheme: 'file' },
    { language: 'verilog', scheme: 'vscode-remote' },
    { language: 'systemverilog', scheme: 'vscode-remote' }
  ];

  constructor() {
    this.subscriptions = [];
    vscode.workspace.onDidChangeConfiguration(this.configFormatter, this, this.subscriptions);
    this.configFormatter();
  }

  private configFormatter(e?: vscode.ConfigurationChangeEvent) {
    if (e && !e.affectsConfiguration('verilogLinter.formatting')) {
      return;
    }

    const formatterName = vscode.workspace.getConfiguration('verilogLinter.formatting').get<string>('formatter', 'none');

    // If formatter hasn't changed its core type, just let it update its own config. No need to nuke the provider.
    if (this.formatter !== null) {
      if (this.formatter.name === formatterName || (this.formatter.name === 'verible' && formatterName === 'verible-verilog-format') || (this.formatter.name === 'istyle' && formatterName === 'istyle-verilog-formatter')) {
        return;
      }
      this.formatter.dispose();
      this.formatter = null;
    }

    if (this.providerRegistration) {
      this.providerRegistration.dispose();
      this.providerRegistration = null;
    }

    if (formatterName === 'verible-verilog-format') {
      this.formatter = new VeribleFormatter();
    } else if (formatterName === 'istyle-verilog-formatter') {
      this.formatter = new IstyleFormatter();
    }

    if (this.formatter) {
      this.providerRegistration = vscode.languages.registerDocumentFormattingEditProvider(this.documentSelector, this.formatter);
    }
  }

  public dispose() {
    if (this.formatter) {
      this.formatter.dispose();
    }
    if (this.providerRegistration) {
      this.providerRegistration.dispose();
    }
    this.subscriptions.forEach((s) => s.dispose());
  }
}
