"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.concatenateFiles', async (uri) => {
        if (!uri.fsPath) {
            vscode.window.showErrorMessage('Please select a valid folder.');
            return;
        }
        const folderPath = uri.fsPath;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Please select a folder within a workspace.');
            return;
        }
        try {
            // Get all files recursively in the folder
            const files = await getAllFilesInFolder(folderPath);
            // Concatenate files
            let concatenatedContent = '';
            for (const file of files) {
                const relativePath = path.relative(workspaceFolder.uri.fsPath, file);
                const fileContent = fs.readFileSync(file, 'utf-8');
                concatenatedContent += `/// ${relativePath}\n\n${fileContent}\n\n`;
            }
            // Open a new untitled document with the concatenated content
            const document = await vscode.workspace.openTextDocument({
                content: concatenatedContent,
            });
            vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage(`Files concatenated successfully and opened in a new tab!`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`An error occurred: ${error.message}`);
        }
    });
    context.subscriptions.push(disposable);
}
async function getAllFilesInFolder(folderPath) {
    const files = [];
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);
        if (entry.isDirectory()) {
            // Recursively get files from subdirectories
            files.push(...(await getAllFilesInFolder(fullPath)));
        }
        else if (entry.isFile()) {
            // Only add files, not directories
            files.push(fullPath);
        }
    }
    return files;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map