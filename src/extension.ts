import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "verilog-linter" is now active!');

    let disposable = vscode.commands.registerCommand('verilog-linter.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Verilog-HDL Linter!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
