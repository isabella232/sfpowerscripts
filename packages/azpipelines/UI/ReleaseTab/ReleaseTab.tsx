import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";


import { showRootComponent } from "../Common";
import  TableComponent from "../TableComponent/TableComponent";


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
    Table,
    SimpleTableCell,
    ColumnSorting,
    SortOrder,
    sortItems
} from "azure-devops-ui/Table";
import { ISimpleListCell } from "azure-devops-ui/List";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Duration } from "azure-devops-ui/Duration";
import { css } from "azure-devops-ui/Util";



interface IPivotContentState {
    projects?: ArrayItemProvider<TeamProjectReference>;
    columns: ITableColumn<any>[];
}

export interface ITableItem extends ISimpleTableCell {
    name: string;
    author: string;
    time: string;
}

export interface ITableItemDetail extends ISimpleTableCell {
    name: ISimpleListCell;
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
    ColumnFill
    ,
    {
        columnLayout: TableColumnLayout.none,
        id: "time",
        name: "Time",
        readonly: true,
        renderCell: renderSimpleCell,
        width: new ObservableValue(100)
    }
    
];

const fixedColumnsDetail = [
    {
        columnLayout: TableColumnLayout.singleLinePrefix,
        id: "name",
        name: "Name",
        readonly: true,
        renderCell: renderSimpleCell,
        width: new ObservableValue(200)
    },
    ColumnFill
    ,
    {
        columnLayout: TableColumnLayout.none,
        id: "time",
        name: "Time",
        readonly: true,
        renderCell: renderSimpleCell,
        width: new ObservableValue(100)
    },
    
];

const renderStatus = (className?: string) => {
    return (
       
                <Status
                {...Statuses.Success}
                ariaLabel="Success"
                
                size={StatusSize.s}
                />
            //     <Status
            //     {...getStatusIndicatorData(statusValue).statusProps}
            //     className="icon-large-margin"
            //     size={StatusSize.l}
            // />
  
    );
};

const renderStatus2 = (className?: string) => {
    return (
       
                <Status
                {...Statuses.Success}
                ariaLabel="Success"
                
                size={StatusSize.s}
                />
            //     <Status
            //     {...getStatusIndicatorData(statusValue).statusProps}
            //     className="icon-large-margin"
            //     size={StatusSize.l}
            // />
  
    );
};
interface IStatusIndicatorData {
    statusProps: IStatusProps;
    label: string;
}
enum PipelineStatus {
    running = "running",
    succeeded = "succeeded",
    failed = "failed",
    warning = "warning"
}


function getStatusIndicatorData(status: string): IStatusIndicatorData {
    status = status || "";
    status = status.toLowerCase();
    const indicatorData: IStatusIndicatorData = {
        label: "Success",
        statusProps: { ...Statuses.Success, ariaLabel: "Success" }
    };
    switch (status) {
        case PipelineStatus.failed:
            indicatorData.statusProps = { ...Statuses.Failed, ariaLabel: "Failed" };
            indicatorData.label = "Failed";
            break;
        case PipelineStatus.running:
            indicatorData.statusProps = { ...Statuses.Running, ariaLabel: "Running" };
            indicatorData.label = "Running";
            break;
        case PipelineStatus.warning:
            indicatorData.statusProps = { ...Statuses.Warning, ariaLabel: "Warning" };
            indicatorData.label = "Warning";

            break;
    }

    return indicatorData;
}



export const rawTableItems: ITableItem[] = [
    {
        time: "50",
        author: "Kang",
        name: "Run version 1"
    }
    
];


//may need to use another obj to do logic to render status conditionally
export var rawTableItemsDetail: ITableItemDetail[] = [
    {
        time: "50",
        name: { iconProps: { render: renderStatus2 }, text: "Rory Boisvert" }
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
export const tableItemsDetail = new ArrayItemProvider<ITableItemDetail>(rawTableItemsDetail);
export const tableItemsNoIconsDetail = new ArrayItemProvider<ITableItemDetail>(
    rawTableItemsDetail.map((item: ITableItemDetail) => {
        const newItem = Object.assign({}, item);
       // newItem.name = { text: newItem.name.text };
        return newItem;
    })
);


/****Advanced Tabled config **/




/****Advanced Tabled config End*/




class PivotContent extends React.Component<{}, IPivotContentState> {    

     
    private isDialogOpen = new ObservableValue<boolean>(false);
    

    constructor(props: {}) {
        super(props);

        // this.state = {
           
        // };
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
            
                <div className="open-dialog-btn" style={{textAlign: 'right'}}>
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
                       
                    />

                   
                    <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
                         <Table ariaLabel="Basic Table" columns={fixedColumns} itemProvider={tableItemsNoIcons} role="table" />
                    </Card>
                  
                    

                </div>

                <div className="execution-logs">
                    
                    <Header
                        title={"Detailed Execution Logs"}
                        
                        titleSize={TitleSize.Medium}
                       
                    />

                    <div style={{textAlign: 'right'}}>
                           <p> Started at: xxxxx</p>
                           <p> Finished in:xxxxx </p>
                    </div>

                    <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
                         <Table ariaLabel="Basic Table" columns={fixedColumnsDetail} itemProvider={tableItemsNoIconsDetail} role="table" />
                    </Card>
                  

                </div>


        
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
