import * as vscode from 'vscode';
import BaseFormatter from './BaseFormatter';

import { VeribleDownloader } from '../downloader/VeribleDownloader';

export default class VeribleFormatter extends BaseFormatter {
  private downloader: VeribleDownloader;

  constructor(context: vscode.ExtensionContext) {
    super('verible');
    this.downloader = new VeribleDownloader(context);
    this.updateConfig();
  }

  protected override async updateConfig() {
    const configuration = vscode.workspace.getConfiguration('verilogLinter.formatting.verible');
    let exe = configuration.get<string>('executable', 'verible-verilog-format');
    const autoDownload = configuration.get<boolean>('autoDownload', true);

    if (autoDownload && (exe === 'verible-verilog-format' || !exe)) {
        const localPath = this.downloader.getLocalBinaryPath();
        if (localPath) {
            exe = localPath;
        } else {
            // Trigger download if not found and autoDownload is on
            exe = await this.downloader.downloadAndExtract() || exe;
        }
    }

    this.config.executable = exe;
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
