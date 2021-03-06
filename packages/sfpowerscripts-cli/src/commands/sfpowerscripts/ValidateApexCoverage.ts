import { flags } from '@salesforce/command';
import SfpowerscriptsCommand from '../../SfpowerscriptsCommand';
import { Messages, SfdxError } from '@salesforce/core';
import ValidateApexCoverageImpl from '@dxatscale/sfpowerscripts.core/lib/sfdxwrappers/ValidateApexCoverageImpl';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@dxatscale/sfpowerscripts', 'validate_apex_coverage');

export default class ValidateApexCoverage extends SfpowerscriptsCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx sfpowerscripts:ValidateApexCoverage -u scratchorg -t 80`
  ];

  protected static requiresProject = true;
  protected static requiresUsername = false;
  protected static requiresDevhubUsername = false;

  protected static flagsConfig = {
    targetorg: flags.string({char: 'u', description: messages.getMessage('targetOrgFlagDescription'), default: 'scratchorg'}),
    testcoverage: flags.string({required: true, char: 't', description: messages.getMessage('testCoverageFlagDescription')})
  };


  public async execute(){
    try {

      const target_org: string = this.flags.targetorg;
      const test_coverage: string = this.flags.testcoverage;


      let validateApexCoverageImpl:ValidateApexCoverageImpl = new ValidateApexCoverageImpl(target_org,Number(test_coverage));
      console.log("Generating command");
      let command = await validateApexCoverageImpl.buildExecCommand();
      await validateApexCoverageImpl.exec(command);



    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  }
}
