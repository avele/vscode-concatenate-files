import {ExtensionContext, commands, window, workspace, Uri} from 'vscode'
import {readFile} from 'fs/promises'
import {relative, join} from 'path'
import {glob} from 'glob'

export function activate(context: ExtensionContext) {
  console.log(
    'Congratulations, your extension "concatenate-files" is now active!'
  )
  window.showInformationMessage('Concatenate Files extension is now active')

  let disposable = commands.registerCommand(
    'extension.concatenateFiles',
    async (uri: Uri) => {
      window.showInformationMessage('concatenateFiles command triggered')

      if (!uri || !uri.fsPath) {
        window.showInformationMessage('No valid URI provided')
        window.showErrorMessage('Please select a valid folder.')
        return
      }

      window.showInformationMessage(`Selected folder: ${uri.fsPath}`)

      const folderPath = uri.fsPath
      const workspaceFolder = workspace.getWorkspaceFolder(uri)
      if (!workspaceFolder) {
        window.showInformationMessage('No workspace folder found')
        window.showErrorMessage('Please select a folder within a workspace.')
        return
      }

      try {
        window.showInformationMessage('Getting ignore patterns from settings')
        const config = workspace.getConfiguration('concatenateFiles')
        console.log(`config:`, config)
        const ignorePatterns: string[] = config.get('ignorePatterns') || []
        console.log(`Ignore patterns: ${ignorePatterns.join(', ')}`)

        console.log('Getting all files in folder')
        const files = await getAllFilesInFolder(folderPath, ignorePatterns)
        console.log(`Found ${files.length} files`)

        console.log('Concatenating files')
        let concatenatedContent = ''

        for (const file of files) {
          try {
            const relativePath = relative(workspaceFolder.uri.fsPath, file)
            console.log(`Processing file: ${relativePath}`)

            const fileContent = await readFile(file, 'utf-8')

            concatenatedContent += `/// ${relativePath}\n\n${fileContent}\n\n`
          } catch (error: any) {
            console.error(`Error in processing file ${file}:`, error)
            console.error(`An error occurred`, error)
          }
        }

        console.log('Opening new document with concatenated content')
        const document = await workspace.openTextDocument({
          content: concatenatedContent,
        })
        window.showTextDocument(document)

        window.showInformationMessage(
          `Files concatenated successfully and opened in a new tab!`
        )
      } catch (error: any) {
        window.showInformationMessage('Error in concatenateFiles:', error)
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
  window.showInformationMessage(`Getting all files in folder: ${folderPath}`)
  window.showInformationMessage(`Ignore patterns: ${ignorePatterns.join(', ')}`)

  const options = {
    cwd: folderPath,
    ignore: ignorePatterns,
    nodir: true,
    absolute: true,
  }

  try {
    const files = await glob('**/*', options)
    window.showInformationMessage(`Found ${files.length} files`)
    return files
  } catch (error) {
    window.showInformationMessage(`Error in getAllFilesInFolder: ${error}`)
    throw error
  }
}

export function deactivate() {
  window.showInformationMessage(
    'Concatenate Files extension is now deactivated'
  )
}
