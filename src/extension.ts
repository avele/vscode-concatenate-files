import {ExtensionContext, commands, window, workspace, Uri} from 'vscode'
import {readFile, stat} from 'fs/promises'
import {relative} from 'path'
import {glob} from 'glob'

export function activate(context: ExtensionContext) {
  let disposable = commands.registerCommand(
    'extension.concatenateFiles',
    async (...args) => {
      // Handle both single and multiple selections through command palette or context menu
      let uris: Uri[] = []

      if (args.length > 0) {
        if (Array.isArray(args[1])) {
          // Context menu with multiple selection
          uris = args[1]
        } else {
          // Single selection
          uris = [args[0]]
        }
      }

      if (!uris.length) {
        window.showErrorMessage('Please select files or folders to process.')
        return
      }

      const workspaceFolder = workspace.getWorkspaceFolder(uris[0])
      if (!workspaceFolder) {
        window.showErrorMessage(
          'Please select files/folders within a workspace.'
        )
        return
      }

      try {
        const config = workspace.getConfiguration('concatenateFiles')
        const ignorePatterns: string[] = config.get('ignorePatterns') || []

        let allFiles: string[] = []

        // Process each selected item
        for (const uri of uris) {
          const stats = await stat(uri.fsPath)

          if (stats.isDirectory()) {
            // If it's a directory, get all files inside
            const files = await getAllFilesInFolder(uri.fsPath, ignorePatterns)
            allFiles.push(...files)
          } else {
            // If it's a file, add it directly
            allFiles.push(uri.fsPath)
          }
        }

        // Remove duplicates
        allFiles = [...new Set(allFiles)]

        let concatenatedContent = ''

        for (const file of allFiles) {
          try {
            const relativePath = relative(workspaceFolder.uri.fsPath, file)
            const fileContent = await readFile(file, 'utf-8')
            concatenatedContent += `/// ${relativePath}\n\n${fileContent}\n\n`
          } catch (error: any) {
            console.error(`Error processing file ${file}:`, error)
          }
        }

        const document = await workspace.openTextDocument({
          content: concatenatedContent,
        })
        await window.showTextDocument(document)

        window.showInformationMessage(
          `${allFiles.length} files concatenated successfully!`
        )
      } catch (error: any) {
        window.showErrorMessage(`An error occurred: ${error.message}`)
      }
    }
  )

  context.subscriptions.push(disposable)
}

async function getAllFilesInFolder(
  folderPath: string,
  ignorePatterns: string[]
): Promise<string[]> {
  const options = {
    cwd: folderPath,
    ignore: ignorePatterns,
    nodir: true,
    absolute: true,
  }

  try {
    return await glob('**/*', options)
  } catch (error) {
    console.error(`Error in getAllFilesInFolder: ${error}`)
    throw error
  }
}

export function deactivate() {}
