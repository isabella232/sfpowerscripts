import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { showRootComponent } from "../Common";


import { getClient } from "azure-devops-extension-api";
import { CoreRestClient, ProjectVisibility, TeamProjectReference } from "azure-devops-extension-api/Core";

import { Table, ITableColumn, renderSimpleCell, renderSimpleCellValue } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";


interface IPivotContentState {
    projects?: ArrayItemProvider<TeamProjectReference>;
    columns: ITableColumn<any>[];
}


class PivotContent extends React.Component<{}, IPivotContentState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            columns: [
                {
                    id: "name",
                    name: "Project",
                    renderCell: renderSimpleCell,
                    width: 200
                },
                {
                    id: "description",
                    name: "Description",
                    renderCell: renderSimpleCell,
                    width: 300
                }
                // {
                //     id: "visibility",
                //     name: "Visibility",
                //     renderCell: (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<TeamProjectReference>, tableItem: TeamProjectReference): JSX.Element => {
                //         return renderSimpleCellValue<any>(columnIndex, tableColumn, tableItem.visibility === ProjectVisibility.Public ? "Public" : "Private");
                //     },
                //     width: 100
                // }
            ]
        };
    }

    public componentDidMount() {
        SDK.init();
        this.initializeComponent();
    }

    private async initializeComponent() {
        //const projects = await getClient(CoreRestClient).getProjects();
        let projects = [];
        this.setState({
            projects: new ArrayItemProvider(projects)
        });
    }

    public render(): JSX.Element {
        return (
            <div className="sample-pivot">
                
             
                {
               

                    `
                    Sample Data: 
                    
                    {
                        "runbook": "SFDC-Core Runbook",
                        "version": 1,
                        "metadata": "This runbook is to be executed befor",
                        "schema_version": 1,
                        "inputs": {
                          "checklist_filepath": "/Users/alan.ly/Workspaces/devops/sfpowerscripts/packages/sfpowerscripts-cli/schema/checklist.yaml",
                          "alias": "dev"
                        },
                        "tasks": [
                          {
                            "task": "Deactivate Sharing Rule",
                            "id": 1,
                            "steps": "Run sfpowerkit script /U23239\n/tDo that\nKick Some\nSKKSKS\nskdjsd\nsdkjs\n",
                            "condition": "always | reject | continue",
                            "status": "Done",
                            "timeTaken": 4138,
                            "User": "AMAC02Z10EKLVDQ",
                            "Date": "2020-06-30T08:17:50.417Z"
                          },
                          {
                            "task": "Deactivate Sharing Rule",
                            "id": 3,
                            "steps": "Do this }\n/tDo that\nKick Some\nSKKSKS\nskdjsd\nsdkjs\n",
                            "runOnlyOn": "dev",
                            "condition": "always | reject | continue",
                            "status": "Skip",
                            "timeTaken": 20940,
                            "User": "AMAC02Z10EKLVDQ",
                            "Date": "2020-06-30T08:18:11.358Z"
                          },
                          {
                            "task": "task number 6",
                            "id": 6,
                            "steps": "Do this }\n/tDo that\nKick Some\nSKKSKS\nskdjsd\nsdkjs\n",
                            "runOnlyOn": "dev",
                            "condition": "always | reject | continue",
                            "status": "Done",
                            "timeTaken": 2722,
                            "User": "AMAC02Z10EKLVDQ",
                            "Date": "2020-06-30T08:27:40.594Z"
                          }
                        ]
                      }
                      `

                }
                
            </div>
        );
    }
}

showRootComponent(<PivotContent />);
