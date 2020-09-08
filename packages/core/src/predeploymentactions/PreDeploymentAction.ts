export default interface PreDeploymentAction
{
    exec():Promise<boolean>;
}