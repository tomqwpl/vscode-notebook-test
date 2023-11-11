import * as vscode from 'vscode';
import { Subject } from 'await-notify';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export class NotebookController implements vscode.Disposable {
  static readonly controllerId = 'test-notebook-controller-id';
  static readonly notebookType = 'test-notebook';
  static readonly supportedLanguages = ['python'];

  private _executionOrder = 0;

  private _executionQueue: ExecutionQueue = new ExecutionQueue({
    executeCell: this._doExecution.bind(this)
  });
  
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

    console.log("cells execution request");
    for (var cell of cells) {
      console.log(cell);
      const clearOutputExecution = controller.createNotebookCellExecution(cell);
      clearOutputExecution.start();
      await clearOutputExecution.clearOutput();
      clearOutputExecution.end(undefined);

      const cellExecution = controller.createNotebookCellExecution(cell);
      this._executionQueue.queueExecution(cellExecution);
    }
  }

  private async _doExecution(execution: vscode.NotebookCellExecution): Promise<void> {
    execution.executionOrder = ++this._executionOrder;
    execution.start(Date.now());
    try {

     await sleep(1000);
     const output = new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.text("Simulated notebook execution result")
      ]);
      output.metadata = { outputType: "display_data" };
      execution.appendOutput([output]);
    }
    finally {
      execution.end(true, Date.now());
    }
  }

  private async _interrupt(notebook: vscode.NotebookDocument) {
  }

}

interface CellExecutor {
  executeCell(cell: vscode.NotebookCellExecution) : Promise<void>;
}

class ExecutionQueue implements vscode.Disposable {
  private cts = new vscode.CancellationTokenSource();
  private _queuedRequests: vscode.NotebookCellExecution[] = [];
  private _processRequests: Subject = new Subject();

  constructor(private readonly cellExecutor: CellExecutor) {
      this.run(this.cts.token);
  }

  dispose() {
      this.cts.cancel();
  }

  public queueExecution(cell: vscode.NotebookCellExecution) {
    this._queuedRequests.push(cell);
    this._processRequests.notify();
  }

  private async run(token: vscode.CancellationToken) {
      while (true) {
          if (token.isCancellationRequested) {
              return;
          }

          while (true) {
              const currentRequest = this._queuedRequests.shift();
              if (!currentRequest) {
                break;
              }

              await this.cellExecutor.executeCell(currentRequest);

              if (token.isCancellationRequested) {
                  return;
              }
          }

          await this._processRequests.wait();
      }
   }

}