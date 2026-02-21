import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ModuleInfo {
    name: string;
    ports: string[];
    params: string[];
    uri: vscode.Uri;
}

export class ModuleIndexer {
    private moduleCache: Map<string, ModuleInfo> = new Map();
    private watcher: vscode.FileSystemWatcher | undefined;

    constructor() {}

    public async scanWorkspace() {
        const uris = await vscode.workspace.findFiles('**/*.{v,sv}');
        for (const uri of uris) {
            await this.indexFile(uri);
        }
        this.setupWatcher();
    }

    private setupWatcher() {
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{v,sv}');
        this.watcher.onDidChange(uri => this.indexFile(uri));
        this.watcher.onDidCreate(uri => this.indexFile(uri));
        this.watcher.onDidDelete(uri => this.moduleCache.delete(uri.fsPath));
    }

    public async indexFile(uri: vscode.Uri) {
        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const text = content.toString();
            this.extractModules(text, uri);
        } catch (error) {
            console.error(`Error indexing file ${uri.fsPath}:`, error);
        }
    }

    private extractModules(text: string, uri: vscode.Uri) {
        // Simple regex to find module definitions and their ports/params
        // This is a basic implementation and can be refined later
        const moduleRegex = /module\s+(\w+)\s*(?:#\s*\(([\s\S]*?)\))?\s*(?:\(([\s\S]*?)\))?\s*;/g;
        let match;

        while ((match = moduleRegex.exec(text)) !== null) {
            const moduleName = match[1];
            const paramText = match[2] || '';
            const portText = match[3] || '';

            const params = this.parseParams(paramText);
            const ports = this.parsePorts(portText);

            this.moduleCache.set(moduleName, {
                name: moduleName,
                ports,
                params,
                uri
            });
        }
    }

    private parseParams(text: string): string[] {
        return text.split(',')
            .map(p => p.trim())
            .map(p => {
                const parts = p.split(/\s+/);
                return parts[parts.length - 2] || ''; // Crude way to get parameter name before '='
            })
            .filter(p => p && !['parameter', 'localparam'].includes(p));
    }

    private parsePorts(text: string): string[] {
        return text.split(',')
            .map(p => p.trim())
            .map(p => {
                const parts = p.split(/\s+/);
                return parts[parts.length - 1] || ''; // Crude way to get port name
            })
            .filter(p => p && !['input', 'output', 'inout', 'wire', 'reg', 'logic'].includes(p));
    }

    public getModules(): ModuleInfo[] {
        return Array.from(this.moduleCache.values());
    }

    public getModule(name: string): ModuleInfo | undefined {
        return this.moduleCache.get(name);
    }

    public dispose() {
        this.watcher?.dispose();
    }
}
