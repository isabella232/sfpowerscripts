import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { showRootComponent } from "../Common";


import { getClient } from "azure-devops-extension-api";
import { CoreRestClient, ProjectVisibility, TeamProjectReference } from "azure-devops-extension-api/Core";


import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Button } from "azure-devops-ui/Button";
import { Dialog } from "azure-devops-ui/Dialog";
import { Observer } from "azure-devops-ui/Observer";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Card } from "azure-devops-ui/Card";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";

import {
    ColumnFill,
    ColumnMore,
    ColumnSelect,
    ISimpleTableCell,
    renderSimpleCell,
    TableColumnLayout,
    renderSimpleCellValue,
    ITableColumn,
    Table
} from "azure-devops-ui/Table";
import { ISimpleListCell } from "azure-devops-ui/List";



interface IPivotContentState {
    projects?: ArrayItemProvider<TeamProjectReference>;
    columns: ITableColumn<any>[];
}

export interface ITableItem extends ISimpleTableCell {
    name: string;
    author: string;
    time: string;
}



const fixedColumns = [
    {
        columnLayout: TableColumnLayout.singleLinePrefix,
        id: "name",
        name: "Name",
        readonly: true,
        renderCell: renderSimpleCell,
        width: new ObservableValue(200)
    },
    {
        id: "author",
        name: "Author",
        readonly: true,
        renderCell: renderSimpleCell,
        width: new ObservableValue(100)
    },
    {
        columnLayout: TableColumnLayout.none,
        id: "time",
        name: "Time",
        readonly: true,
        renderCell: renderSimpleCell,
        width: new ObservableValue(100)
    },
    ColumnFill
];


export const rawTableItems: ITableItem[] = [
    {
        time: "50",
        author: "Kang",
        name: "Run version 1"
    }
    
];

export const tableItems = new ArrayItemProvider<ITableItem>(rawTableItems);
export const tableItemsNoIcons = new ArrayItemProvider<ITableItem>(
    rawTableItems.map((item: ITableItem) => {
        const newItem = Object.assign({}, item);
       // newItem.name = { text: newItem.name.text };
        return newItem;
    })
);

class PivotContent extends React.Component<{}, IPivotContentState> {    

     


    private isDialogOpen = new ObservableValue<boolean>(false);

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

     onChange(event) {
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.onload = function(event) {
          // The file's text will be printed here
          console.log(event.target.result);
        };
      
        reader.readAsText(file);
      }

 
    public render(): JSX.Element {
        const onDismiss = () => {
            this.isDialogOpen.value = false;
        };
        return (
            <div>
            
                <div className="open-dialog-btn">
                <Button
                            text="Submit an execution log"
                            primary={true}
                            onClick={() => {
                                this.isDialogOpen.value = true;
                            }}
                />
                </div>
                <div className="execution-logs">
                    
                    <Header
                        title={"Submitted Execution Logs"}
                        
                        titleSize={TitleSize.Medium}
                        titleIconProps={{ iconName: "OpenSource" }}
                    />

                    <div className="page-content">
                    <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
                        <Table ariaLabel="Basic Table" columns={fixedColumns} itemProvider={tableItemsNoIcons} role="table" />
                    </Card>
                    </div>
                    

                </div>
                <div className="detail-logs"></div>
                <Observer isDialogOpen={this.isDialogOpen}>
                    {(props: { isDialogOpen: boolean }) => {
                        return props.isDialogOpen ? (
                            <Dialog
                                titleProps={{ text: "Confirm" }}
                                footerButtonProps={[
                                    {
                                        text: "Cancel",
                                        onClick: onDismiss
                                    },
                                    {
                                        text: "Save",
                                        onClick: onDismiss,
                                        primary: true
                                    }
                                ]}
                                onDismiss={onDismiss}
                            >
                                Please select a file:
                                
                                <input type="file" onChange={e => this.onChange(e)}></input>
                            </Dialog>
                        ) : null;
                    }}
                </Observer>

            </div>
           
        );
    }
}

showRootComponent(<PivotContent />);
