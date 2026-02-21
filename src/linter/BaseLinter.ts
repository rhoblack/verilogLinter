import * as vscode from 'vscode';
import * as path from 'path';
import { expandEnvironmentVariables } from '../utils';

export interface LinterConfig {
  executable: string;
  arguments: string;
  includePath: string[];
}

export default abstract class BaseLinter {
  protected diagnosticCollection: vscode.DiagnosticCollection;
  name: string;
  protected outputChannel: vscode.OutputChannel;
  protected configListener: vscode.Disposable;

  protected config: LinterConfig = {
    executable: '',
    arguments: '',
    includePath: [],
  };

  constructor(name: string, diagnosticCollection: vscode.DiagnosticCollection) {
    this.diagnosticCollection = diagnosticCollection;
    this.name = name;
    this.outputChannel = vscode.window.createOutputChannel(`Verilog Linter Debug (${name})`);

    this.configListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`verilogLinter.linting.${name}`)) {
        this.updateConfig();
      }
    });
    // First time setup - MUST be synchronous so `lint()` uses correct values immediately
    this.updateConfig();
  }

  protected abstract updateConfig(): void;

  protected resolveIncludePaths(paths: string[]): string[] {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      return paths;
    }
    const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    return paths.map((p) => {
        const expanded = expandEnvironmentVariables(p);
        if (path.isAbsolute(expanded)) return expanded;
        return path.join(root, expanded);
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

  public dispose() {
    this.configListener.dispose();
  }

  protected abstract lint(doc: vscode.TextDocument): void;
}
