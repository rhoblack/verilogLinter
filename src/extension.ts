import * as vscode from 'vscode';
import LintManager from './linter/LintManager';

let lintManager: LintManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "verilog-linter" is now active!');

    lintManager = new LintManager();
    context.subscriptions.push(lintManager);

    let disposable = vscode.commands.registerCommand('verilog-linter.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Verilog-HDL Linter!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    if (lintManager) {
        lintManager.dispose();
    }
}
