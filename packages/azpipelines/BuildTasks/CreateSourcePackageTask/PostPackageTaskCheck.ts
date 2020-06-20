import tl = require("azure-pipelines-task-lib/task");


async function run() {
  console.log("Checking whether Post Package Create Task is added to the pipeline");
  let isPostPackageTaskExecuted:string = tl.getVariable("post_package_task_executed");
  if(isPostPackageTaskExecuted != "true")
  {
      tl.setResult(
            tl.TaskResult.SucceededWithIssues,
            `Post Package Task not executed/added in the pipeline, Please add it at the end of package creation commands!`
          );
  }
}



run();
