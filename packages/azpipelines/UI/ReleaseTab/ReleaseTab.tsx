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

import { Toast } from "azure-devops-ui/Toast";





interface IPivotContentState {
    contentsFromFile?: ArrayItemProvider<any>;
    tableItems?: ArrayItemProvider<ITableItem>;
    tableItemDetail?: ArrayItemProvider<ITableItemDetail>;
    isClicked?: Boolean;
    hasDuplicatedChecksum?: Boolean
    
}

export interface ITableItem extends ISimpleTableCell {
    name: string;
    author: string;
    time: string;
    checksum: number;
}

export interface ITableItemDetail extends ISimpleTableCell {
    name: ISimpleListCell;
    time: number;
    checksum: number;
    status?: any;
}

export interface documentForRelease {
    id: string,
    logInfo: any
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
        width: new ObservableValue(500)
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





class PivotContent extends React.Component<{}, IPivotContentState> {    

     
    private isDialogOpen = new ObservableValue<boolean>(false);
    private toastRef: React.RefObject<Toast> = React.createRef<Toast>();


    //data used in the submitted execution logs
    private rawTableItems: ITableItem[] = [];
    
    //data used in the detailed execution logs
    //may need to use another obj to do logic to render status conditionally
    private rawTableItemsDetail: ITableItemDetail[] = [];

    private rawTableItemsNewlyAdded: ITableItem[] = [];

    private rawTableItemsInit: ITableItem[] = [];
    private rawTableItemsDetailinit: ITableItemDetail[] = [];


    private tableItems = new ArrayItemProvider<ITableItem>(this.rawTableItems);

    private tableItemsNewlyAdded = new ArrayItemProvider<ITableItem>(this.rawTableItemsNewlyAdded);

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
        //     name: "Run version 1",
        //     checksum: 22
        // }
           ]),
           tableItemDetail: new ArrayItemProvider([]),
           isClicked: false,
           hasDuplicatedChecksum: false
         };

        // this.flag = true;
      
    }

    public async componentDidMount() {

        SDK.init();
        SDK.ready().then(() => {

           this.initializeComponent();            

        });
       
        //if(this.flag)
        // this.initializeComponent();
        
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

    
        // const projects = await getClient(CoreRestClient).getProjects();


        // const projectId = "cb898a3e-2c0b-4815-adab-21b9c9333002";
        // const project = projects.find(x => x.id === projectId);

        // const releases = await getClient(ReleaseRestClient).getReleases();

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
        let docs = await getClient(ExtensionManagementRestClient).getDocumentsByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement");

        console.log("Documents of ReleaseExtensionManagement: ", docs);

        //let doc:documentForRelease;
        for(let i=0; i<docs.length; i++) {
            if(docs[i].id == documentId) {
                 let doc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", documentId);

                 for(let j=0; j<doc.logInfo.length; j++) {
                    this.rawTableItems = [...doc.logInfo[j].tableItems.items, ...this.rawTableItems];
                    this.rawTableItemsDetail = [...doc.logInfo[j].tableItemDetail.items, ...this.rawTableItemsDetail];
                    
                }
        
                console.log("Raw table items: ", this.rawTableItems);
        
                this.rawTableItemsInit = this.rawTableItems;
                this.rawTableItemsDetailinit = this.rawTableItemsDetail;
        
                this.setState(
                    prevState => {
        
                        console.log("Previous state is: ", prevState);
        
        
                            return {
                                tableItems: new ArrayItemProvider(
                                   // this.rawTableItems
                                   this.rawTableItemsInit
                                       ),
                                tableItemDetail: new ArrayItemProvider(
                                    this.rawTableItemsDetailinit
                                    //this.rawTableItemsDetail
                               )
                            }
                        
                    }
                );
            }
        }
        
        //let doc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", documentId);

        //console.log("Fetched documentis: ", doc);


        //initialize raw table items
        // this.rawTableItems = doc.tableItems.items;
        // this.rawTableItemsDetail = doc.tableItemDetail.items;

        // for(let i=0; i<doc.logInfo.length; i++) {
        //     this.rawTableItems = [...doc.logInfo[i].tableItems.items, ...this.rawTableItems];
        //     this.rawTableItemsDetail = [...doc.logInfo[i].tableItemDetail.items, ...this.rawTableItemsDetail];
            
        // }

        // console.log("Raw table items: ", this.rawTableItems);


        // this.setState(
        //     prevState => {

        //         console.log("Previous state is: ", prevState);


        //             return {
        //                 tableItems: new ArrayItemProvider(
        //                     this.rawTableItems
        //                        ),
        //                 tableItemDetail: new ArrayItemProvider(
        //                     // doc.logInfo[0].tableItemDetail.items
        //                     this.rawTableItemsDetail
        //                )
        //             }
                
        //     }
        // );

         //initialize raw table items
        

        

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
        
        //init hasDuplicatedChecksum
        this.setState({
            hasDuplicatedChecksum: false
        });

        //get doc of this release
        let documentId = "79";

        //all documents in the collection
        let docs = await getClient(ExtensionManagementRestClient).getDocumentsByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement");


        if(docs.length == 0) {
            //No document initially
            let logInfoItem = {
                tableItems:  self.tableItemsNewlyAdded,
                tableItemDetail: self.tableItemsDetail
            }
    
            let logInfo = [logInfoItem];
            let docToBeSent = {
                id: "79",
                logInfo: logInfo
            }
           let document = await getClient(ExtensionManagementRestClient).createDocumentByName(docToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");
           console.log("First Document Created: ", document);
           //update state
            this.setState({
                tableItems: self.tableItems,
                tableItemDetail: self.tableItemsDetail
            });


        }else {

             //already had documents in the collection
            for(let i=0; i<docs.length; i++) {
                //update the old doc
                if(docs[i].id == documentId) {
                    let doc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", documentId);
                    let logInfoItem = {
                        tableItems:  self.tableItemsNewlyAdded,
                        tableItemDetail: self.tableItemsDetail
                    }
            
                    let logInfo = [...doc.logInfo,logInfoItem];
                    let docToBeSent = {
                        __etag: doc.__etag,
                        id: "79",
                        logInfo: logInfo
                    }

                    console.log("Doc to be sent fromonSave: ", docToBeSent);

                    console.log("logInfoItem: ", logInfoItem);

                    console.log("TEST########### ", doc.logInfo[0].tableItems.items[0].checksum);
                    console.log("Checksum in local storage: ", self.checkSum);

                    console.log("Doc received: ", doc);

                    for(let j=0; j<doc.logInfo.length; j++) {
                        if(self.checkSum == doc.logInfo[j].tableItems.items[0].checksum) {
                            console.log("Duplicated checksum found");
                            self.isDialogOpen.value = false;

                            //alert user that the checksum is the same
                            // this.setState({
                            //     hasDuplicatedChecksum: true
                            // });

                        let rawTableItems: ITableItem[] = [];
                        let rawTableItemsDetail: ITableItemDetail[] = [];
                        for(let j=0; j<doc.logInfo.length; j++) {
                            rawTableItems = [...doc.logInfo[j].tableItems.items, ...rawTableItems];
                            rawTableItemsDetail = [...doc.logInfo[j].tableItemDetail.items, ...rawTableItemsDetail];         
                        }
                        this.setState(
                            prevState => {
                                    return {
                                        tableItems: new ArrayItemProvider(rawTableItems),
                                        tableItemDetail: new ArrayItemProvider(rawTableItemsDetail),
                                        hasDuplicatedChecksum: true
                                    }          
                            }
                        );

                            return;
                        }
                    }

                   
                    console.log("rawTableItemsInit in onSave: ", this.rawTableItemsInit);

                
                        let document = await getClient(ExtensionManagementRestClient).setDocumentByName(docToBeSent,PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE,"ReleaseExtensionManagement");
                        console.log("Document updated: ", document);

                        //set the state
                        let docAfterUpdate = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", documentId);
                        
                        let rawTableItems: ITableItem[] = [];
                        let rawTableItemsDetail: ITableItemDetail[] = [];

                        for(let j=0; j<docAfterUpdate.logInfo.length; j++) {
                            rawTableItems = [...docAfterUpdate.logInfo[j].tableItems.items, ...rawTableItems];
                            rawTableItemsDetail = [...docAfterUpdate.logInfo[j].tableItemDetail.items, ...rawTableItemsDetail];         
                        }

                        this.setState(
                            prevState => {
                                    return {
                                        tableItems: new ArrayItemProvider(rawTableItems),
                                        tableItemDetail: new ArrayItemProvider(rawTableItemsDetail)
                                    }          
                            }
                        );
                        break;
                }

                //create the new doc if no Id matched
                if((docs[i].id != documentId) && (i == docs.length-1)) {
                    let logInfoItem = {
                        tableItems:  self.tableItemsNewlyAdded,
                        tableItemDetail: self.tableItemsDetail
                    }
                    let docToBeSent = {
                        id: "79",
                        logInfo: [logInfoItem]
                    }

                    let document = await getClient(ExtensionManagementRestClient).createDocumentByName(docToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");
                    console.log("New Document Created: ", document);
                    //update state
                    this.setState({
                        tableItems: self.tableItems,
                        tableItemDetail: self.tableItemsDetail
                    });
                    break;
                }
            }
        }


        
         console.log("JSON body: ", self.fileContent);

      
         //let document = await getClient(ExtensionManagementRestClient).createDocumentByName(documentToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");
         //let document = await getClient(ExtensionManagementRestClient).deleteDocumentByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement", "79");
          
        //let document = await getClient(ExtensionManagementRestClient).setDocumentByName(docToBeSent,PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE,"ReleaseExtensionManagement");
         //console.log("Document created: ", document);
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
                    
                        
                        console.log(data);
                        let name = data.runbook;
                        let author = "kang2";
                        let time = "sometime";


                        self.rawTableItems.push({
                            name:name,
                            author:author,
                            time:time,
                            checksum: data.checksum
                        });


                        self.rawTableItemsNewlyAdded = [];
                        self.rawTableItemsNewlyAdded.push({
                            name:name,
                            author:author,
                            time:time,
                            checksum: data.checksum
                        })

                        let newTableItemsNewlyAdded = new ArrayItemProvider<ITableItem>(self.rawTableItemsNewlyAdded);
                        self.tableItemsNewlyAdded = newTableItemsNewlyAdded;

                        console.log("tableItemsNewlyAdded is: ", self.tableItemsNewlyAdded);
        
                        let newTableItems = new ArrayItemProvider<ITableItem>(self.rawTableItems);

                        
                        //self.tableItems
                        //update tableItems var
                        self.tableItems = newTableItems;
                   
                        console.log("New items to be added: ",newTableItems);
                       
        
                        /****Populate data to detail execution logs */
                        self.rawTableItemsDetail = [];
                        for(let i =0; i<data.tasks.length; i++) {
        
                            let nameDetail = data.tasks[i].task;
                            let timeTaken = data.tasks[i].timeTaken;
                            let status = data.tasks[i].status;
        
                            console.log(nameDetail,timeTaken,status);
        
                            if(status == "Done") {
                                self.rawTableItemsDetail.push({
                                    checksum: data.checksum,
                                    time: timeTaken,
                                    name: {
                                        iconProps: { render: renderStatusSuccess }, text: nameDetail
                                    },
                                    status: "Done"
                                });
                            }else if(status == "Skip") {
                                self.rawTableItemsDetail.push({
                                    checksum: data.checksum,
                                    time: timeTaken,
                                    name: {
                                        iconProps: { render: renderStatusSkipped }, text: nameDetail
                                    },
                                    status: "Skip"
                                });
                            }else if(status == "Fail") {
                                self.rawTableItemsDetail.push({
                                    checksum: data.checksum,
                                    time: timeTaken,
                                    name: {
                                        iconProps: { render: renderStatusFailed }, text: nameDetail
                                    },
                                    status: "Fail"
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

    const hanldeRowClick = async data => {

        let d = JSON.stringify(data.data);

        console.log(d);

        if(!this.state.isClicked) {
            this.setState({
                isClicked:true
            });
        }
       

        let checksum = data.data.checksum;

        if(this.state.tableItemDetail)
        console.log("State in handleClick: ",this.state.tableItemDetail.length);


         //this can be fetched via url on release page
         let documentId = "79";
         //get document based on document Id (release Id)
         let doc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", documentId);
 
         console.log("Doc on handleClick: ", doc.logInfo[0].tableItemDetail.items.length);

         let detailItemTobeDisplayed: ITableItemDetail[] = [];

         for(let i=0; i<doc.logInfo.length; i++) {
             for(let j=0; j<doc.logInfo[i].tableItemDetail.items.length; j++) {
                 if(doc.logInfo[i].tableItemDetail.items[j].checksum.toString() === checksum.toString()) {
                    detailItemTobeDisplayed = [...detailItemTobeDisplayed, doc.logInfo[i].tableItemDetail.items[j]]
                    
                 }
             }
         }

        console.log("Detail item to be displayed: ", detailItemTobeDisplayed);


        let updatedDetailItem: ITableItemDetail[] = [];
         //check status on detailItemTobeDisplayed
         for(let i=0; i<detailItemTobeDisplayed.length; i++) {
             if(detailItemTobeDisplayed[i].hasOwnProperty('status')) {
                if(detailItemTobeDisplayed[i].status == "Done") {
                    updatedDetailItem.push({
                        checksum: detailItemTobeDisplayed[i].checksum,
                        time: Number(((detailItemTobeDisplayed[i].time * Math.pow(10,-3))).toFixed(2)),
                        name: {
                            iconProps: { render: renderStatusSuccess }, text: detailItemTobeDisplayed[i].name.text
                        },
                        status: "Done"
                    });
                }else if(detailItemTobeDisplayed[i].status == "Skip") {
                    updatedDetailItem.push({
                        checksum: detailItemTobeDisplayed[i].checksum,
                        time: Number(((detailItemTobeDisplayed[i].time * Math.pow(10,-3))).toFixed(2)),
                        name: {
                            iconProps: { render: renderStatusSkipped }, text: detailItemTobeDisplayed[i].name.text
                        },
                        status: "Done"
                    });
                }else if(detailItemTobeDisplayed[i].status == "Fail") {
                    updatedDetailItem.push({
                        checksum: detailItemTobeDisplayed[i].checksum,
                        time: Number(((detailItemTobeDisplayed[i].time * Math.pow(10,-3))).toFixed(2)),
                        name: {
                            iconProps: { render: renderStatusFailed }, text: detailItemTobeDisplayed[i].name.text
                        },
                        status: "Fail"
                    });
                }
             }
         }



         this.setState({
            tableItemDetail: new ArrayItemProvider(
                updatedDetailItem
           )
        });

        console.log("State in oncliked: ", this.state);

    }
         
             

       
          


        return (
            
         
            <div>
                {
                    this.state.hasDuplicatedChecksum &&
                    
                    <Toast
                    ref={this.toastRef}
                    message="Duplicated file found!"
                    callToAction="Cancel"
                    onCallToActionClick={() => this.setState({hasDuplicatedChecksum: false})}
                    />
                    
                }
               
             
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
                         <Table ariaLabel="Basic Table" columns={fixedColumns} itemProvider={this.state.tableItems} role="table" 
                        onSelect={(event, data) => hanldeRowClick(data)}/>
                    </Card>

                </div>

                <div className="execution-logs">
                    
                    <Header
                        title={"Detailed Execution Logs"}
                        
                        titleSize={TitleSize.Medium}
                       
                    />
            {
                this.state.isClicked ?
                <div>
                    <div style={{textAlign: 'right'}}>
                           <p> Started at: xxxxx</p>
                           <p> Finished in:xxxxx </p>
                    </div>

                    <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
                         <Table ariaLabel="Basic Table" columns={fixedColumnsDetail} itemProvider={this.state.tableItemDetail} role="table" />
                    </Card>
                </div>
                : <p>Nothing</p>
            }

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
