export default interface PostDeploymentAction
{
    exec():Promise<boolean>;
}