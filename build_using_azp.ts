import child_process = require("child_process");
import { exit } from "process";
let sleep = require("util").promisify(setTimeout);
let resultAsJSON = child_process.execSync(
  `az pipelines build queue --branch ${process.argv[2]}  --project sfpowerscripts --definition-id 46 --org https://dev.azure.com/dxatscale`,
  {
    encoding: "utf8",
  }
);
let result = JSON.parse(resultAsJSON);
let buildId = result["id"];
console.log("Build Triggered with Id", buildId);
while (true) {
  resultAsJSON = child_process.execSync(
    `az pipelines build show --org https://dev.azure.com/dxatscale  --project sfpowerscripts --id ${buildId}`,
    {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }
  );

  result = JSON.parse(resultAsJSON);
  if (result.status == "completed") {
    
    console.log(
      `Build completed, View results at https://dev.azure.com/dxatscale/sfpowerscripts/_build/results?buildId=${buildId}&view=results`
    );
    exit(0);
  } else {
    sleep(450000);
    console.log("Build in Progress");
  }
}

