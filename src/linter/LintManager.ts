import * as vscode from 'vscode';
import BaseLinter from './BaseLinter';
import VcsLinter from './VcsLinter';
import XceliumLinter from './XceliumLinter';
import XvlogLinter from './XvlogLinter';

export default class LintManager {
  private subscriptions: vscode.Disposable[];
  private linter: BaseLinter | null = null;
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.subscriptions = [];
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('verilog');

    vscode.workspace.onDidOpenTextDocument(this.lint, this, this.subscriptions);
    vscode.workspace.onDidSaveTextDocument(this.lint, this, this.subscriptions);
    vscode.workspace.onDidCloseTextDocument(this.removeFileDiagnostics, this, this.subscriptions);
    vscode.workspace.onDidChangeConfiguration(this.configLinter, this, this.subscriptions);

    this.configLinter();

    // Check currently open documents
    vscode.workspace.textDocuments.forEach(this.lint, this);
  }

  private configLinter() {
    const linterName = vscode.workspace.getConfiguration('verilogLinter.linting').get<string>('linter', 'none');

    if (this.linter !== null) {
      if (this.linter.name === linterName) {
        return; // No change
      }
    }

    this.diagnosticCollection.clear();
    this.linter = null;

    if (linterName === 'vcs') {
      this.linter = new VcsLinter(this.diagnosticCollection);
    } else if (linterName === 'xcelium') {
      this.linter = new XceliumLinter(this.diagnosticCollection);
    } else if (linterName === 'xvlog') {
      this.linter = new XvlogLinter(this.diagnosticCollection);
    }
  }

  private lint(doc: vscode.TextDocument) {
    const langId = doc.languageId;
    if (langId === 'verilog' || langId === 'systemverilog') {
      if (this.linter) {
        this.linter.startLint(doc);
      }
    }
  }

  private removeFileDiagnostics(doc: vscode.TextDocument) {
    if (this.linter) {
      this.linter.removeFileDiagnostics(doc);
    }
  }

  public dispose() {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
    this.subscriptions.forEach((s) => s.dispose());
  }
}
