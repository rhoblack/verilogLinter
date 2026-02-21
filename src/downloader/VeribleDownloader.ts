import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as child_process from 'child_process';
import { promisify } from 'util';

const exec = promisify(child_process.exec);

export class VeribleDownloader {
    private static readonly REPO = 'chipsalliance/verible';
    private static readonly BINARY_NAME = 'verible-verilog-format';
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('Verible Downloader');
    }

    /**
     * Estimates the binary path if it exists locally in globalStorage.
     */
    public getLocalBinaryPath(): string | undefined {
        const storagePath = this.context.globalStorageUri.fsPath;
        this.outputChannel.appendLine(`[Binary Search] Searching in: ${storagePath}`);
        
        if (!fs.existsSync(storagePath)) {
            this.outputChannel.appendLine(`[Binary Search] Storage path does not exist.`);
            return undefined;
        }

        const exeName = this.getExeName();
        this.outputChannel.appendLine(`[Binary Search] Looking for: ${exeName}`);

        // Recursive search for the binary
        const findBinary = (dir: string): string | undefined => {
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        const found = findBinary(fullPath);
                        if (found) return found;
                    } else if (file === exeName) {
                        return fullPath;
                    }
                }
            } catch (e) {
                this.outputChannel.appendLine(`[Binary Search] Error reading ${dir}: ${e}`);
            }
            return undefined;
        };

        const foundPath = findBinary(storagePath);
        if (foundPath) {
            this.outputChannel.appendLine(`[Binary Search] Found binary at: ${foundPath}`);
            return foundPath;
        }

        this.outputChannel.appendLine(`[Binary Search] Binary not found in global storage.`);
        return undefined;
    }

    public async downloadAndExtract(): Promise<string | undefined> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Downloading Verible Formatter...",
            cancellable: false
        }, async (progress) => {
            try {
                this.outputChannel.show(true);
                this.outputChannel.appendLine(`[Download] Starting Verible download process...`);

                progress.report({ message: "Checking for latest version..." });
                const assetUrl = await this.getLatestAssetUrl();
                if (!assetUrl) throw new Error("Could not find suitable Verible asset for your OS.");

                this.outputChannel.appendLine(`[Download] Found asset: ${assetUrl}`);

                const storagePath = this.context.globalStorageUri.fsPath;
                if (!fs.existsSync(storagePath)) {
                    this.outputChannel.appendLine(`[Download] Creating storage directory...`);
                    fs.mkdirSync(storagePath, { recursive: true });
                }

                const fileName = path.basename(assetUrl);
                const downloadPath = path.join(storagePath, fileName);

                await this.downloadFile(assetUrl, downloadPath, progress);

                this.outputChannel.appendLine(`[Download] Extracting to: ${storagePath}`);
                progress.report({ message: `Extracting...` });
                await this.extract(downloadPath, storagePath);

                // Clean up zip/tarball
                fs.unlinkSync(downloadPath);
                this.outputChannel.appendLine(`[Download] Extraction complete. Cleaning up...`);

                const finalPath = this.getLocalBinaryPath();
                if (finalPath) {
                    const version = path.basename(path.dirname(path.dirname(finalPath)));
                    this.outputChannel.appendLine(`[Download] Installed Verible version: ${version}`);
                    vscode.window.showInformationMessage(`Verible Formatter updated to ${version}`);
                }
                return finalPath;
            } catch (err: any) {
                this.outputChannel.appendLine(`[Download Error] ${err.message}`);
                vscode.window.showErrorMessage(`Verible Download Failed: ${err.message}`);
                return undefined;
            }
        });
    }

    private async getLatestAssetUrl(url?: string): Promise<string | undefined> {
        return new Promise((resolve, reject) => {
            const requestUrl = url || `https://api.github.com/repos/${VeribleDownloader.REPO}/releases/latest`;
            const options: https.RequestOptions = {
                headers: { 'User-Agent': 'vscode-verilog-linter' },
                timeout: 15000
            };

            const request = https.get(requestUrl, options, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    resolve(this.getLatestAssetUrl(res.headers.location));
                    return;
                }

                if (res.statusCode !== 200) {
                    reject(new Error(`GitHub API returned ${res.statusCode}`));
                    return;
                }

                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
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
                    } catch (e) {
                        reject(new Error("Failed to parse GitHub response"));
                    }
                });
            });
            
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error("GitHub API request timed out (15s)"));
            });
        });
    }

    private async downloadFile(url: string, dest: string, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
        return new Promise((resolve, reject) => {
            const options = {
                headers: { 'User-Agent': 'vscode-verilog-linter' },
                timeout: 30000 
            };

            const request = (targetUrl: string) => {
                this.outputChannel.appendLine(`[Download] Connecting to GitHub: ${targetUrl}`);
                progress.report({ message: "Connecting to GitHub..." });
                
                https.get(targetUrl, options, (res) => {
                    if (res.statusCode === 302 || res.statusCode === 301) {
                        const redirectUrl = res.headers.location!;
                        request(redirectUrl);
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

                    progress.report({ message: `Starting download... (Total: ${(totalSize / 1024 / 1024).toFixed(1)}MB)` });

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
                            // If content-length is missing, just show MBs
                            progress.report({ message: `Downloading... ${(downloadedSize / 1024 / 1024).toFixed(1)}MB` });
                        }
                    });

                    res.pipe(file);
                    
                    file.on('finish', () => {
                        file.close();
                        this.outputChannel.appendLine(`[Download] Download complete.`);
                        resolve();
                    });

                    file.on('error', (err) => {
                        this.outputChannel.appendLine(`[Download] File stream error: ${err.message}`);
                        if (fs.existsSync(dest)) fs.unlinkSync(dest);
                        reject(err);
                    });
                }).on('error', (err) => {
                    this.outputChannel.appendLine(`[Download] Request error: ${err.message}`);
                    if (fs.existsSync(dest)) fs.unlinkSync(dest);
                    reject(err);
                }).on('timeout', () => {
                    this.outputChannel.appendLine(`[Download] Request timeout.`);
                    if (fs.existsSync(dest)) fs.unlinkSync(dest);
                    reject(new Error("Download timed out."));
                });
            };
            request(url);
        });
    }

    private async extract(filePath: string, destDir: string): Promise<void> {
        try {
            if (process.platform === 'win32') {
                await exec(`powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${destDir}' -Force"`);
            } else {
                await exec(`tar -xzf "${filePath}" -C "${destDir}"`);
            }
        } catch (e: any) {
            this.outputChannel.appendLine(`[Extract Error] ${e.message}`);
            throw e;
        }
    }

    private getExeName(): string {
        return process.platform === 'win32' ? `${VeribleDownloader.BINARY_NAME}.exe` : VeribleDownloader.BINARY_NAME;
    }
}
