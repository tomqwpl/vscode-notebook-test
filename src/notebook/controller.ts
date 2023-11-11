import * as vscode from 'vscode';
import { Subject } from 'await-notify';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export class NotebookController implements vscode.Disposable {
  static readonly controllerId = 'test-notebook-controller-id';
  static readonly notebookType = 'test-notebook';
  static readonly supportedLanguages = ['python'];

  private _executionOrder = 0;

  constructor() {
    const controller = vscode.notebooks.createNotebookController(
      NotebookController.controllerId,
      NotebookController.notebookType,
      "Test Notebook Kernel"
    );

    controller.supportedLanguages = NotebookController.supportedLanguages;
    controller.supportsExecutionOrder = true;
    controller.executeHandler = this._execute.bind(this);
    controller.interruptHandler = this._interrupt.bind(this);
  }

  dispose(): void {
  }

  private async _execute(
    cells: vscode.NotebookCell[],
    notebook: vscode.NotebookDocument,
    controller: vscode.NotebookController
  ): Promise<void> {

    for (var cell of cells) {
      this._doExecution(cell, controller);
    }
  }

  private async _doExecution(cell: vscode.NotebookCell, controller: vscode.NotebookController): Promise<void> {
    const execution = controller.createNotebookCellExecution(cell);
    execution.executionOrder = ++this._executionOrder;
    execution.start(Date.now());
    try {

     await sleep(1000);
     const output = new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.text("Simulated notebook execution result")
      ]);
      output.metadata = { outputType: "display_data" };
      execution.replaceOutput([output]);
    }
    finally {
      execution.end(true, Date.now());
    }
  }

  private async _interrupt(notebook: vscode.NotebookDocument) {
  }

}
