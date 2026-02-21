import * as vscode from 'vscode';
import * as path from 'path';

export interface LinterConfig {
  arguments: string;
  includePath: string[];
}

export default abstract class BaseLinter {
  protected diagnosticCollection: vscode.DiagnosticCollection;
  name: string;
  protected config: LinterConfig = {
    arguments: '',
    includePath: [],
  };

  constructor(name: string, diagnosticCollection: vscode.DiagnosticCollection) {
    this.diagnosticCollection = diagnosticCollection;
    this.name = name;

    vscode.workspace.onDidChangeConfiguration(() => {
      this.updateConfig();
    });
    // First time setup
    setTimeout(() => this.updateConfig(), 0);
  }

  protected abstract updateConfig(): void;

  protected resolveIncludePaths(paths: string[]): string[] {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      return paths;
    }
    const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    return paths.map((p) => {
      if (path.isAbsolute(p)) return p;
      return path.join(root, p);
    });
  }

  protected getWorkingDirectory(doc: vscode.TextDocument): string {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      return vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    return path.dirname(doc.uri.fsPath);
  }

  public startLint(doc: vscode.TextDocument) {
    this.lint(doc);
  }

  public removeFileDiagnostics(doc: vscode.TextDocument) {
    this.diagnosticCollection.delete(doc.uri);
  }

  protected abstract lint(doc: vscode.TextDocument): void;
}
