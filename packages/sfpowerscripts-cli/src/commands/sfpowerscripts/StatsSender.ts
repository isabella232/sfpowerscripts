import PackageMetadata from "@dxatscale/sfpowerscripts.core/lib/PackageMetadata";
import ArtifactGenerator from "@dxatscale/sfpowerscripts.core/lib/generators/ArtifactGenerator";
import BuildImpl from "@dxatscale/sfpowerscripts.core/lib/parallelBuilder/BuildImpl";
import { EOL } from "os";

import { flags } from "@salesforce/command";
import SfpowerscriptsCommand from "../../SfpowerscriptsCommand";
import { Messages } from "@salesforce/core";
import { exec } from "shelljs";
import SFPStatsSender from "@dxatscale/sfpowerscripts.core/lib/utils/SFPStatsSender";

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages("@dxatscale/sfpowerscripts", "build");

export default class StatsSender extends SfpowerscriptsCommand {
  public static description = messages.getMessage("commandDescription");

  public static examples = [
    `$ sfdx sfpowerscripts:Build -n <packagealias> -b -x -v <devhubalias> --refname <name>`,
    `$ sfdx sfpowerscripts:Build -n <packagealias> -b -x -v <devhubalias> --diffcheck --gittag\n`,
  ];

  protected static requiresUsername = false;
  protected static requiresDevhubUsername = false;

  

  public async execute() {

    const diffcheck: boolean = false;
    const isSkipValidation: boolean = true;
    const isValidateMode: boolean = false;
    const isBlank:boolean=false;
    

    console.log("Start");
    SFPStatsSender.logGauge('test.size',3600000);
    SFPStatsSender.logGauge('test.size1',3600000,{test:"1",test2:"2",test3:"3"});
    SFPStatsSender.logGauge('test.size2',36000020,{test:"1",test2:"2",test3:"3"});
    SFPStatsSender.logGauge('test.size3',3600000,{test:"1",test2:"2",test3:"3",test4:"3"});
    console.log("End");


    console.log(String(isSkipValidation));
    console.log(String(isBlank));
    

    SFPStatsSender.logGauge(
      "build.total_packages.duration",
      3600000,
      {
        isDiffCheckEnabled: "false" ,
        isvalidated: "true",
        prmode: "false"
      }
    );
    console.log("Test2");
  
  }


}
