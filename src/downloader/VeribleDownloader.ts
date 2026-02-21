import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as child_process from 'child_process';
import { promisify } from 'util';

const exec = promisify(child_process.exec);

export class VeribleDownloader {
    private static readonly REPO = 'google/verible';
    private static readonly BINARY_NAME = 'verible-verilog-format';

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Estimates the binary path if it exists locally in globalStorage.
     */
    public getLocalBinaryPath(): string | undefined {
        const storagePath = this.context.globalStorageUri.fsPath;
        const binSubDir = process.platform === 'win32' ? 'bin' : 'bin'; // Usually in bin folder after extraction
        
        // We look for any folder starting with 'verible-' and containing 'bin/verible-verilog-format'
        if (!fs.existsSync(storagePath)) return undefined;

        const folders = fs.readdirSync(storagePath);
        for (const folder of folders) {
            if (folder.startsWith('verible-')) {
                const fullPath = path.join(storagePath, folder, binSubDir, this.getExeName());
                if (fs.existsSync(fullPath)) {
                    return fullPath;
                }
            }
        }
        return undefined;
    }

    public async downloadAndExtract(): Promise<string | undefined> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Downloading Verible Formatter...",
            cancellable: false
        }, async (progress) => {
            try {
                const assetUrl = await this.getLatestAssetUrl();
                if (!assetUrl) throw new Error("Could not find suitable Verible asset for your OS.");

                const storagePath = this.context.globalStorageUri.fsPath;
                if (!fs.existsSync(storagePath)) {
                    fs.mkdirSync(storagePath, { recursive: true });
                }

                const fileName = path.basename(assetUrl);
                const downloadPath = path.join(storagePath, fileName);

                await this.downloadFile(assetUrl, downloadPath, progress);

                progress.report({ message: `Extracting...` });
                await this.extract(downloadPath, storagePath);

                // Clean up zip/tarball
                fs.unlinkSync(downloadPath);

                const finalPath = this.getLocalBinaryPath();
                if (finalPath) {
                    vscode.window.showInformationMessage(`Verible Formatter updated to ${path.basename(path.dirname(path.dirname(finalPath)))}`);
                }
                return finalPath;
            } catch (err: any) {
                vscode.window.showErrorMessage(`Verible Download Failed: ${err.message}`);
                return undefined;
            }
        });
    }

    private async getLatestAssetUrl(): Promise<string | undefined> {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: `/repos/${VeribleDownloader.REPO}/releases/latest`,
                headers: { 'User-Agent': 'vscode-verilog-linter' }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const release = JSON.parse(data);
                    const platform = process.platform;
                    let pattern = '';

                    if (platform === 'win32') {
                        pattern = 'win64.zip';
                    } else if (platform === 'linux') {
                        pattern = 'linux-static-x86_64.tar.gz';
                    } else if (platform === 'darwin') {
                        pattern = 'macOS.tar.gz';
                    }

                    const asset = release.assets.find((a: any) => a.name.endsWith(pattern));
                    resolve(asset?.browser_download_url);
                });
            }).on('error', reject);
        });
    }

    private async downloadFile(url: string, dest: string, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
        return new Promise((resolve, reject) => {
            const options = {
                headers: { 'User-Agent': 'vscode-verilog-linter' },
                timeout: 30000 
            };

            const request = (targetUrl: string) => {
                https.get(targetUrl, options, (res) => {
                    if (res.statusCode === 302 || res.statusCode === 301) {
                        request(res.headers.location!);
                        return;
                    }

                    if (res.statusCode !== 200) {
                        reject(new Error(`Server responded with ${res.statusCode}`));
                        return;
                    }

                    const totalSize = parseInt(res.headers['content-length'] || '0', 10);
                    let downloadedSize = 0;
                    let lastPercent = 0;
                    const file = fs.createWriteStream(dest);

                    res.on('data', (chunk) => {
                        downloadedSize += chunk.length;
                        if (totalSize > 0) {
                            const percent = Math.floor((downloadedSize / totalSize) * 100);
                            if (percent > lastPercent) {
                                const increment = percent - lastPercent;
                                lastPercent = percent;
                                progress.report({ 
                                    message: `Downloading... ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB)`,
                                    increment: increment
                                });
                            }
                        } else {
                            progress.report({ message: `Downloading... ${(downloadedSize / 1024 / 1024).toFixed(1)}MB` });
                        }
                    });

                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', (err) => {
                    if (fs.existsSync(dest)) fs.unlinkSync(dest);
                    reject(err);
                }).on('timeout', () => {
                    if (fs.existsSync(dest)) fs.unlinkSync(dest);
                    reject(new Error("Download timed out."));
                });
            };
            request(url);
        });
    }

    private async extract(filePath: string, destDir: string): Promise<void> {
        if (process.platform === 'win32') {
            await exec(`powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${destDir}' -Force"`);
        } else {
            await exec(`tar -xzf "${filePath}" -C "${destDir}"`);
        }
    }

    private getExeName(): string {
        return process.platform === 'win32' ? `${VeribleDownloader.BINARY_NAME}.exe` : VeribleDownloader.BINARY_NAME;
    }
}
