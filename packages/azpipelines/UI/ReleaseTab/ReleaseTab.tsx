import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";


import { showRootComponent } from "../Common";
import  TableComponent, { tableItems } from "../TableComponent/TableComponent";


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
    contentsFromFile?: ArrayItemProvider<any>;
    tableItems?: ArrayItemProvider<ITableItem>;
    tableItemDetail?: ArrayItemProvider<ITableItemDetail>;
   
    
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

const renderStatusSuccess = (className?: string) => {
    return (
       
                <Status
                {...Statuses.Success}
                ariaLabel="Success"
                
                size={StatusSize.s}
                />
  
    );
};

const renderStatusFailed = (className?: string) => {
    return (
       
                <Status
                {...Statuses.Failed}
                ariaLabel="Failed"
                
                size={StatusSize.s}
                /> 
    );
};

const renderStatusSkipped = (className?: string) => {
    return (
        <Status
        {...Statuses.Skipped}
        key="skipped"
        size={StatusSize.m}
        
    />
    );
}



/****Advanced Tabled config **/
// interface IStatusIndicatorData {
//     statusProps: IStatusProps;
//     label: string;
// }
// enum PipelineStatus {
//     running = "running",
//     succeeded = "succeeded",
//     failed = "failed",
//     warning = "warning"
// }


// function getStatusIndicatorData(status: string): IStatusIndicatorData {
//     status = status || "";
//     status = status.toLowerCase();
//     const indicatorData: IStatusIndicatorData = {
//         label: "Success",
//         statusProps: { ...Statuses.Success, ariaLabel: "Success" }
//     };
//     switch (status) {
//         case PipelineStatus.failed:
//             indicatorData.statusProps = { ...Statuses.Failed, ariaLabel: "Failed" };
//             indicatorData.label = "Failed";
//             break;
//         case PipelineStatus.running:
//             indicatorData.statusProps = { ...Statuses.Running, ariaLabel: "Running" };
//             indicatorData.label = "Running";
//             break;
//         case PipelineStatus.warning:
//             indicatorData.statusProps = { ...Statuses.Warning, ariaLabel: "Warning" };
//             indicatorData.label = "Warning";

//             break;
//     }

//     return indicatorData;
// }

/****Advanced Tabled config End*/






class PivotContent extends React.Component<{}, IPivotContentState> {    

     
    private isDialogOpen = new ObservableValue<boolean>(false);

    //data used in the submitted execution logs
    private rawTableItems: ITableItem[] = [
        {
            time: "50",
            author: "Kang",
            name: "Run version 1"
        }
        
    ];
    
    //data used in the detailed execution logs
    //may need to use another obj to do logic to render status conditionally
    private rawTableItemsDetail: ITableItemDetail[] = [
        {
            time: "50",
            name: { iconProps: { render: renderStatusFailed }, text: "Rory Boisvert" }
        }
        
    ];


    private tableItems = new ArrayItemProvider<ITableItem>(this.rawTableItems);
    private tableItemsNoIcons = new ArrayItemProvider<ITableItem>(
       this.rawTableItems.map((item: ITableItem) => {
           const newItem = Object.assign({}, item);
          // newItem.name = { text: newItem.name.text };
           return newItem;
       })
   );
   private tableItemsDetail = new ArrayItemProvider<ITableItemDetail>(this.rawTableItemsDetail);
   private tableItemsNoIconsDetail = new ArrayItemProvider<ITableItemDetail>(
       this.rawTableItemsDetail.map((item: ITableItemDetail) => {
           const newItem = Object.assign({}, item);
          // newItem.name = { text: newItem.name.text };
           return newItem;
       })
   );



    constructor(props: {}) {
        super(props);

         this.state = {
           tableItems: new ArrayItemProvider([]),
           tableItemDetail: new ArrayItemProvider([])
         };
    }

    public componentDidMount() {
        SDK.init();
        this.initializeComponent();
    }

    private async initializeComponent() {
        //const projects = await getClient(CoreRestClient).getProjects();
        // let projects = [];
        // this.setState({
        //     contentsFromFile: new ArrayItemProvider([]),
        //     tableItems: new ArrayItemProvider([])
        // });
       
    }
    

    

 
    public render(): JSX.Element {
        const onDismiss = () => {
            this.isDialogOpen.value = false;
            
        };

        const onChange = (event) => {

            var self = this;
 
             var file = event.target.files[0];
             var reader = new FileReader();
           
 
             reader.onload = function(event) {
        
               /*** Populated data to submitted execution logs*/
            
                if(event !=null) { 
                    if(event.target != null) {
                        if(event.target.result != null) {
                            let data: any = JSON.parse((event.target.result).toString());
                            
                            if(data != null) {
            
                        
                           // console.log(data);
                            let name = data.runbook;
                            let author = "kang2";
                            let time = "sometime";
                            self.rawTableItems.push({
                                name:name,
                                author:author,
                                time:time
                            });
            
                            let newTableItems = new ArrayItemProvider<ITableItem>(self.rawTableItems);
                       
                            console.log(newTableItems);
                            self.setState(
                                {
                                tableItems: newTableItems
                                }
                                
                            );
            
                            /****Populate data to detail execution logs */
                            for(let i =0; i<data.tasks.length; i++) {
            
                                let nameDetail = data.tasks[i].task;
                                let timeTaken = data.tasks[i].timeTaken;
                                let status = data.tasks[i].status;
            
                                console.log(nameDetail,timeTaken,status);
            
                                if(status == "Done") {
                                    self.rawTableItemsDetail.push({
                                        time: timeTaken,
                                        name: {
                                            iconProps: { render: renderStatusSuccess }, text: nameDetail
                                        }
                                    });
                                }else if(status == "Skip") {
                                    self.rawTableItemsDetail.push({
                                        time: timeTaken,
                                        name: {
                                            iconProps: { render: renderStatusSkipped }, text: nameDetail
                                        }
                                    });
                                }
                                
            
                            }
            
                            let newTableItemsDetail = new ArrayItemProvider<ITableItemDetail>(self.rawTableItemsDetail);
            
                            // console.log(self.rawTableItemsDetail);
                            // console.log(newTableItemsDetail);
                            self.setState(
                                {
                                    tableItemDetail: newTableItemsDetail
                                }
                                
                            );
            
                            // self.setState({tableItemDetail: new ArrayItemProvider<ITableItemDetail>([])}, () => {
                            //             return {
                            //                 tableItemDetail: newTableItemsDetail
                            //             }
                            // });
                        
            
                            // self.setState(
                            //     prevState => {
                                    
                            //             return {
                            //                 tableItemDetail: newTableItemsDetail
                            //             }
                                
                                   
                            //     }
                            // );
                            }
                        


                        }
                    }
                }
                
 
 
             };
           
             reader.readAsText(file);
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
                         <Table ariaLabel="Basic Table" columns={fixedColumns} itemProvider={this.state.tableItems} role="table" />
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
                         <Table ariaLabel="Basic Table" columns={fixedColumnsDetail} itemProvider={this.state.tableItemDetail} role="table" />
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
                                
                                <input type="file" onChange={e => onChange(e)}></input>
                            </Dialog>
                        ) : null;
                    }}
                </Observer>

            </div>
           
        );
    }


  
}

showRootComponent(<PivotContent />);
