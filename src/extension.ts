import {ExtensionContext, commands, window, workspace, Uri} from 'vscode'
import {readFile} from 'fs/promises'
import {relative, join} from 'path'
import {glob} from 'glob'

export function activate(context: ExtensionContext) {
  let disposable = commands.registerCommand(
    'extension.concatenateFiles',
    async (uri: Uri) => {
      if (!uri.fsPath) {
        window.showErrorMessage('Please select a valid folder.')
        return
      }

      const folderPath = uri.fsPath
      const workspaceFolder = workspace.getWorkspaceFolder(uri)
      if (!workspaceFolder) {
        window.showErrorMessage('Please select a folder within a workspace.')
        return
      }

      try {
        // Get ignore patterns from settings
        const config = workspace.getConfiguration('concatenateFiles')
        const ignorePatterns: string[] = config.get('ignorePatterns') || []

        // Get all files recursively in the folder, respecting ignore patterns
        const files = await getAllFilesInFolder(folderPath, ignorePatterns)

        // Concatenate files
        let concatenatedContent = ''

        for (const file of files) {
          const relativePath = relative(workspaceFolder.uri.fsPath, file)
          const fileContent = await readFile(file, 'utf-8')

          concatenatedContent += `/// ${relativePath}\n\n${fileContent}\n\n`
        }

        // Open a new untitled document with the concatenated content
        const document = await workspace.openTextDocument({
          content: concatenatedContent,
        })
        window.showTextDocument(document)

        window.showInformationMessage(
          `Files concatenated successfully and opened in a new tab!`
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
    const files = await glob('**/*', options)
    return files.map(file => join(folderPath, file))
  } catch (error) {
    console.error('Error in getAllFilesInFolder:', error)
    throw error
  }
}

export function deactivate() {}
