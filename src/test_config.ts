import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('verilogLinter.linting.vcs');
    const exe = config.get<string>('executable', 'vcs-default');
    console.log(`TEST CONFIG - Executable:`, exe);
    
    // Test the specific nested setting directly too
    const fullConfig = vscode.workspace.getConfiguration('verilogLinter');
    console.log(`TEST CONFIG - Full:`, fullConfig.get('linting.vcs.executable'));
}
