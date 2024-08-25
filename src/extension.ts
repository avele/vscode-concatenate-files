import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'extension.concatenateFiles',
    async (uri: vscode.Uri) => {
      if (!uri.fsPath) {
        vscode.window.showErrorMessage('Please select a valid folder.')
        return
      }

      const folderPath = uri.fsPath
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)
      if (!workspaceFolder) {
        vscode.window.showErrorMessage(
          'Please select a folder within a workspace.'
        )
        return
      }

      try {
        // Get all files recursively in the folder
        const files = await getAllFilesInFolder(folderPath)

        // Concatenate files
        let concatenatedContent = ''

        for (const file of files) {
          const relativePath = path.relative(workspaceFolder.uri.fsPath, file)
          const fileContent = fs.readFileSync(file, 'utf-8')

          concatenatedContent += `/// ${relativePath}\n\n${fileContent}\n\n`
        }

        // Open a new untitled document with the concatenated content
        const document = await vscode.workspace.openTextDocument({
          content: concatenatedContent,
        })
        vscode.window.showTextDocument(document)

        vscode.window.showInformationMessage(
          `Files concatenated successfully and opened in a new tab!`
        )
      } catch (error: any) {
        vscode.window.showErrorMessage(`An error occurred: ${error.message}`)
      }
    }
  )

  context.subscriptions.push(disposable)
}

async function getAllFilesInFolder(folderPath: string): Promise<string[]> {
  const files: string[] = []
  const entries = fs.readdirSync(folderPath, {withFileTypes: true})

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name)

    if (entry.isDirectory()) {
      // Recursively get files from subdirectories
      files.push(...(await getAllFilesInFolder(fullPath)))
    } else if (entry.isFile()) {
      // Only add files, not directories
      files.push(fullPath)
    }
  }

  return files
}

export function deactivate() {}
