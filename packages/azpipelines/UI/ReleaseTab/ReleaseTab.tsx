import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";




import { showRootComponent } from "../Common";
import  TableComponent, { tableItems } from "../TableComponent/TableComponent";


import { getClient } from "azure-devops-extension-api";
import { CoreRestClient, ProjectVisibility, TeamProjectReference } from "azure-devops-extension-api/Core";

import { ReleaseRestClient, Release } from "azure-devops-extension-api/Release";
import {ExtensionManagementRestClient} from "azure-devops-extension-api/ExtensionManagement";


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

const PUBLISHER_NAME = "AzlamSalam";
const EXTENSION_NAME = "sfpowerscripts-dev";
const SCOPE_TYPE = "Default";
const SCOPE_VALUE = "Current";


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
        // {
        //     time: "50",
        //     author: "Kang",
        //     name: "Run version 1"
        // }
        
    ];
    
    //data used in the detailed execution logs
    //may need to use another obj to do logic to render status conditionally
    private rawTableItemsDetail: ITableItemDetail[] = [
        // {
        //     time: "50",
        //     name: { iconProps: { render: renderStatusFailed }, text: "Rory Boisvert" }
        // }
        
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

   private fileUploaderEvent: any;

   private releaseObj;

   private fileContent;

   private checkSum;


    constructor(props: {}) {
        super(props);

        console.log("Constructor called");

         this.state = {
           tableItems: new ArrayItemProvider([
        //         {
        //     time: "50",
        //     author: "Kang",
        //     name: "Run version 1"
        // }
           ]),
           tableItemDetail: new ArrayItemProvider([])
         };
    }

    public async componentDidMount() {
        SDK.init();
        this.initializeComponent();
        
        // .then(response => {
        //     this.setState({
        //     tableItems: response.tableItems,
        //     tableItemDetail: response.tableItemDetail
        //     });

        //     this.tableItems = response.tableItems;
        //     this.tableItemsDetail = response.tableItemDetail;

        //     console.log("After promise state: ", this.state);
        //     //this.forceUpdate();
        // });

        // let documentId = "79";
        // //get document based on document Id (release Id)
        // let doc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", documentId);

        // this.setState({
        //     tableItems: doc.tableItems,
        //     tableItemDetail: doc.tableItemDetail
        // });
       // this.forceUpdate();

        console.log("State in componentDidMount: ", this.state);
       
    }

    private async initializeComponent() {
        const projects = await getClient(CoreRestClient).getProjects();


        const projectId = "cb898a3e-2c0b-4815-adab-21b9c9333002";
        const project = projects.find(x => x.id === projectId);

        const releases = await getClient(ReleaseRestClient).getReleases();

        //const queryString = window.location;

        //just a hard code release ID example
        // const releaseId = 79;

        // let release = await getClient(ReleaseRestClient).getRelease(projectId, releaseId);

        // this.releaseObj = release;

        //console.log(queryString);
        //const releaseId = await getClient(ReleaseRestClient).;
        
        // let projects = [];
       


        //this can be fetched via url on release page
        let documentId = "79";
        //get document based on document Id (release Id)
        let doc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", documentId);

        console.log("Fetched documentis: ", doc);

        // console.log("Projects are: ", projects);
        // console.log("Project is: ", project);
        // console.log("Releases are: ", releases);
        // console.log("Release is: ", release);


        //  this.setState({
        //     tableItems: doc.tableItems,
        //     tableItemDetail: doc.tableItemDetail
        // });

        

        console.log("State in initializeComponent: ", this.state);

       // return doc;
  
       
    }



    

 
    public render(): JSX.Element {

        console.log('render markup called: ',this.state );

       
        
        const onDismiss = () => {
            this.isDialogOpen.value = false;
            
        };

       

       const onSave = async () => {

            var self = this;

            self.setState(
                {
                tableItems:  self.tableItems
                }
                
            );

            self.setState(
                prevState => {

                    console.log("Previous state is: ", prevState);

                        return {
                            tableItemDetail: self.tableItemsDetail
                        }
                    
                }
            );

           // let release = await getClient(ReleaseRestClient).updateRelease(releaseGot, "cb898a3e-2c0b-4815-adab-21b9c9333002", 79);

           //self.fileContent.id = self.fileContent.checksum.toString();
           //self.fileContent.collection = "ReleaseExtensionManagement";

           //the document id should be release Id on a specific page
           //self.fileContent.id = "79"



         let documentToBeSent = {
            id: "79",
            tableItems:  self.tableItems,
            tableItemDetail: self.tableItemsDetail
         }

   
         console.log("JSON body: ", self.fileContent);
          let document = await getClient(ExtensionManagementRestClient).createDocumentByName(documentToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");
         //let document = await getClient(ExtensionManagementRestClient).deleteDocumentByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement", "79");
          console.log("Document created: ", document);
           // console.log("After update release: ",release);
           // console.log("After update releaseObj: ",self.releaseObj);

            self.isDialogOpen.value = false;

        }

        

       const onChange = (event) => {

        //console.log("OnChange state: ", this. state);
       
        console.log('Saved file');

        var self = this;

         var file = event.target.files[0];
         var reader = new FileReader();


         reader.onload = function(event) {
    
           /*** Populated data to submitted execution logs*/
        
            if(event !=null) { 
                if(event.target != null) {
                    if(event.target.result != null) {
                        let data: any = JSON.parse((event.target.result).toString());

                        //store file content
                        self.fileContent = data;
                        
                        if(data != null) {
        
                        //assign checksum
                        self.checkSum = data.checksum;
                    
                        //console.log(data);
                        let name = data.runbook;
                        let author = "kang2";
                        let time = "sometime";
                        self.rawTableItems.push({
                            name:name,
                            author:author,
                            time:time
                        });
        
                        let newTableItems = new ArrayItemProvider<ITableItem>(self.rawTableItems);

                        //update tableItems var
                        self.tableItems = newTableItems;
                   
                        console.log(newTableItems);
                        // self.setState(
                        //     {
                        //     tableItems: newTableItems
                        //     }
                            
                        // );
        
                        /****Populate data to detail execution logs */
                        self.rawTableItemsDetail = [];
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
        
                        //update tableItemsDetail var
                        self.tableItemsDetail = newTableItemsDetail;


                        console.log("table items detail var: ",self.tableItemsDetail);
                    
        
                        // self.setState(
                        //     prevState => {

                        //         console.log("Previous state is: ", prevState);

                        //             return {
                        //                 tableItemDetail: newTableItemsDetail
                        //             }
                                
                        //     }
                        // );

                        console.log("State after update: ",self.state);


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
                                        onClick: onSave,
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
