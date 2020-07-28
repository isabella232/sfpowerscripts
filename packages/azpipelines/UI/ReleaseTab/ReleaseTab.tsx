import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";




import { showRootComponent } from "../Common";
import  TableComponent, { tableItems } from "../TableComponent/TableComponent";


import { getClient } from "azure-devops-extension-api";
import { CoreRestClient, ProjectVisibility, TeamProjectReference } from "azure-devops-extension-api/Core";

import 
    { ReleaseRestClient, 
    Release,
    ReleaseDefinitionEnvironment

} from "azure-devops-extension-api/Release";
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
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { ListSelection } from "azure-devops-ui/List";


import {
    BuildRestClient,
    IBuildPageDataService,
    BuildServiceIds,
  } from "azure-devops-extension-api/Build";

  import {
    IHostPageLayoutService,
    CommonServiceIds
  } from "azure-devops-extension-api/Common/CommonServices";

  import {
    IVssRestClientOptions
  } from "azure-devops-extension-api/Common/Context";
import { ReleaseApi } from "azure-devops-node-api/ReleaseApi";

  

interface IPivotContentState {
    contentsFromFile?: ArrayItemProvider<any>;
    tableItems?: ArrayItemProvider<ITableItem>;
    tableItemDetail?: ArrayItemProvider<ITableItemDetail>;
    isClicked?: Boolean;
    hasDuplicatedChecksum?: Boolean
    addFileSuccess?:Boolean
    indexOfDetailLogRow?:number
    
}

export interface ITableItem extends ISimpleTableCell {
    name: string;
    author: string;
    time: string;
    checksum: number;
    dateIdentifier?: any
}

export interface ITableItemDetail extends ISimpleTableCell {
    name: ISimpleListCell;
    time: number;
    checksum: number;
    status?: any;
    dateIdentifier?: any
    tasks?: any
}

export interface documentForRelease {
    id: string,
    logInfo: any
}

const PUBLISHER_NAME = "AzlamSalam";
const EXTENSION_NAME = "sfpowerscripts-dev";
const SCOPE_TYPE = "Default";
const SCOPE_VALUE = "Current";

//URL of the current release page
const currentUrl = window.location.href;
const fakeURL = currentUrl;
//const fakeURL = "https://safebot.visualstudio.com/sfpowerreview/_releaseProgress?releaseId=160&environmentId=298&extensionId=AzlamSalam.sfpowerscripts-dev.release-tab&_a=release-environment-extension";
const projectId = "cb898a3e-2c0b-4815-adab-21b9c9333002";

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
    private isDetailDialogOpen = new ObservableValue<boolean>(false);
    private toastRef: React.RefObject<Toast> = React.createRef<Toast>();

    private selection = new ListSelection({ selectOnFocus: false, multiSelect: true });


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
           hasDuplicatedChecksum: false,
           addFileSuccess: false,
           indexOfDetailLogRow: 0
         };

        // this.flag = true;
         
        
      
    }

    public async componentDidMount() {

        SDK.init();
        SDK.ready().then(() => {

           this.initializeComponent();            

        });


        console.log("State in componentDidMount: ", this.state);
       
    }

    private async initializeComponent() {

        //const projectId = "cb898a3e-2c0b-4815-adab-21b9c9333002";


        
        //const info = await getClient(ReleaseRestClient).getDefinitionEnvironments(projectId);
         //const info2 = await getClient(ReleaseRestClient).getArtifactTypeDefinitions(projectId);
        // const info3 = await getClient(ReleaseRestClient).getReleaseSettings(projectId);
        // //const info4 = await getClient(ReleaseRestClient).get
        

         //console.log("getDefinitionEnvironments: ", info);
        // console.log("getArtifactTypeDefinitions: ", info2);
        // console.log("page info: ", info3);

        // let releaseinfo = await getClient(ReleaseRestClient).getReleaseSettings(projectId);
        // console.log("Release page data info: ", releaseinfo);

        console.log("Current window location: ", currentUrl);

        console.log("Date: ", Date.now());
      
        //const fakeURL = "https://safebot.visualstudio.com/sfpowerreview/_releaseProgress?releaseId=160&environmentId=298&extensionId=AzlamSalam.sfpowerscripts-dev.release-tab&_a=release-environment-extension";

        const urlParams = new URL(fakeURL);
        const releaseId = urlParams.searchParams.get('releaseId');
        const environmentId = urlParams.searchParams.get('environmentId');
        console.log("url params: ",urlParams);
        console.log("release id: ",releaseId);
        console.log("environment id: ",environmentId);
    
        if(releaseId && environmentId) {

        let release = await getClient(ReleaseRestClient).getRelease(projectId, Number(releaseId));
        let releaseName = release.name;
        console.log("Release Name: ", releaseName);


        //this can be fetched via url on release page
        let documentId = releaseName + '_' + releaseId + '_' + environmentId;
        //let documentId = "79"
        console.log("Doc Id: ", documentId);//Release-62_160_298
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
    }
      

        console.log("State in initializeComponent: ", this.state);

       // return doc;
  
       
    }



    

 
    public render(): JSX.Element {

        console.log('render markup called: ',this.state );

       
        
        const onDismiss = () => {
            this.isDialogOpen.value = false;
            
        };

        const onDetailDismiss = () => {
            this.isDetailDialogOpen.value = false;
            
        };





       

       const onSave = async () => {

        var self = this;
        
        //init hasDuplicatedChecksum
        this.setState({
            hasDuplicatedChecksum: false,
            addFileSuccess: false
        });

        const urlParams = new URL(fakeURL);
        const releaseId = urlParams.searchParams.get('releaseId');
        const environmentId = urlParams.searchParams.get('environmentId');



        if(releaseId && environmentId) {

        //get doc of this release
        let release = await getClient(ReleaseRestClient).getRelease(projectId, Number(releaseId));
        let releaseName = release.name;
        let documentId = releaseName + '_' + releaseId + '_' + environmentId;

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
                id: documentId,
                logInfo: logInfo
            }
           let document = await getClient(ExtensionManagementRestClient).createDocumentByName(docToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");
           console.log("First Document Created: ", document);
           //update state
            this.setState({
                tableItems: self.tableItems,
                tableItemDetail: self.tableItemsDetail,
                addFileSuccess: true
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
                        id: documentId,//release id and env id
                        logInfo: logInfo
                    }

                    console.log("Doc to be sent fromonSave: ", docToBeSent);

                    console.log("logInfoItem: ", logInfoItem);

                    console.log("TEST########### ", doc.logInfo[0].tableItems.items[0].checksum);
                    console.log("Checksum in local storage: ", self.checkSum);

                    console.log("Doc received: ", doc);

                    // for(let j=0; j<doc.logInfo.length; j++) {
                    //     if(self.checkSum == doc.logInfo[j].tableItems.items[0].checksum) {
                    //         console.log("Duplicated checksum found");
                    //         self.isDialogOpen.value = false;

                    //         //alert user that the checksum is the same
                    //         // this.setState({
                    //         //     hasDuplicatedChecksum: true
                    //         // });

                    //     let rawTableItems: ITableItem[] = [];
                    //     let rawTableItemsDetail: ITableItemDetail[] = [];
                    //     for(let j=0; j<doc.logInfo.length; j++) {
                    //         rawTableItems = [...doc.logInfo[j].tableItems.items, ...rawTableItems];
                    //         rawTableItemsDetail = [...doc.logInfo[j].tableItemDetail.items, ...rawTableItemsDetail];         
                    //     }
                    //     this.setState(
                    //         prevState => {
                    //                 return {
                    //                     tableItems: new ArrayItemProvider(rawTableItems),
                    //                     tableItemDetail: new ArrayItemProvider(rawTableItemsDetail),
                    //                     hasDuplicatedChecksum: true,
                    //                     addFileSuccess: false
                    //                 }          
                    //         }
                    //     );

                    //         return;
                    //     }
                    // }

                   
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

                        //let d = await getClient(ExtensionManagementRestClient).deleteDocumentByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE,"ReleaseExtensionManagement", documentId);

                        this.setState(
                            prevState => {
                                    return {
                                        tableItems: new ArrayItemProvider(rawTableItems),
                                        tableItemDetail: new ArrayItemProvider(rawTableItemsDetail),
                                        addFileSuccess: true,
                                        isClicked: false
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
                        id: documentId,
                        logInfo: [logInfoItem]
                    }

                    let document = await getClient(ExtensionManagementRestClient).createDocumentByName(docToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");
                    console.log("New Document Created: ", document);
                    //update state
                    this.setState({
                        tableItems: self.tableItems,
                        tableItemDetail: self.tableItemsDetail,
                        addFileSuccess: true
                    });
                    break;
                }
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

                        const dateIdentifier = Date.now();


                        self.rawTableItems.push({
                            name:name,
                            author:author,
                            time:time,
                            checksum: data.checksum,
                            dateIdentifier: dateIdentifier
                        });


                        self.rawTableItemsNewlyAdded = [];
                        self.rawTableItemsNewlyAdded.push({
                            name:name,
                            author:author,
                            time:time,
                            checksum: data.checksum,
                            dateIdentifier: dateIdentifier
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
                            let tasks = data.tasks;
        
                            console.log(nameDetail,timeTaken,status);
        
                            if(status == "Done") {
                                self.rawTableItemsDetail.push({
                                    checksum: data.checksum,
                                    time: timeTaken,
                                    name: {
                                        iconProps: { render: renderStatusSuccess }, text: nameDetail
                                    },
                                    status: "Done",
                                    dateIdentifier: dateIdentifier,
                                    tasks: tasks
                                });
                            }else if(status == "Skip") {
                                self.rawTableItemsDetail.push({
                                    checksum: data.checksum,
                                    time: timeTaken,
                                    name: {
                                        iconProps: { render: renderStatusSkipped }, text: nameDetail
                                    },
                                    status: "Skip",
                                    dateIdentifier: dateIdentifier,
                                    tasks: tasks
                                });
                            }else if(status == "Fail") {
                                self.rawTableItemsDetail.push({
                                    checksum: data.checksum,
                                    time: timeTaken,
                                    name: {
                                        iconProps: { render: renderStatusFailed }, text: nameDetail
                                    },
                                    status: "Fail",
                                    dateIdentifier: dateIdentifier,
                                    tasks: tasks
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
        let dateIdentifier = data.data.dateIdentifier;

        if(this.state.tableItemDetail)
        console.log("State in handleClick: ",this.state.tableItemDetail.length);


         //this can be fetched via url on release page
        const urlParams = new URL(fakeURL);
        const releaseId = urlParams.searchParams.get('releaseId');
        const environmentId = urlParams.searchParams.get('environmentId');


        if(releaseId && environmentId) {

        //get doc of this release
        let release = await getClient(ReleaseRestClient).getRelease(projectId, Number(releaseId));
        let releaseName = release.name;
        let documentId = releaseName + '_' + releaseId + '_' + environmentId;
         //get document based on document Id (release Id)
         let doc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", documentId);
 
         console.log("Doc on handleClick: ", doc);

         let detailItemTobeDisplayed: ITableItemDetail[] = [];

         for(let i=0; i<doc.logInfo.length; i++) {
             for(let j=0; j<doc.logInfo[i].tableItemDetail.items.length; j++) {
                 if(doc.logInfo[i].tableItemDetail.items[j].dateIdentifier.toString() === dateIdentifier.toString()) {
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
                        status: "Done",
                        dateIdentifier: detailItemTobeDisplayed[i].dateIdentifier,
                        tasks: detailItemTobeDisplayed[i].tasks
                    });
                }else if(detailItemTobeDisplayed[i].status == "Skip") {
                    updatedDetailItem.push({
                        checksum: detailItemTobeDisplayed[i].checksum,
                        time: Number(((detailItemTobeDisplayed[i].time * Math.pow(10,-3))).toFixed(2)),
                        name: {
                            iconProps: { render: renderStatusSkipped }, text: detailItemTobeDisplayed[i].name.text
                        },
                        status: "Done",
                        dateIdentifier: detailItemTobeDisplayed[i].dateIdentifier,
                        tasks: detailItemTobeDisplayed[i].tasks
                    });
                }else if(detailItemTobeDisplayed[i].status == "Fail") {
                    updatedDetailItem.push({
                        checksum: detailItemTobeDisplayed[i].checksum,
                        time: Number(((detailItemTobeDisplayed[i].time * Math.pow(10,-3))).toFixed(2)),
                        name: {
                            iconProps: { render: renderStatusFailed }, text: detailItemTobeDisplayed[i].name.text
                        },
                        status: "Fail",
                        dateIdentifier: detailItemTobeDisplayed[i].dateIdentifier,
                        tasks: detailItemTobeDisplayed[i].tasks
                    });
                }
             }
         }



         this.setState({
            tableItemDetail: new ArrayItemProvider(
                updatedDetailItem
           )
        });
        }


        console.log("State in oncliked: ", this.state);

    }

    const handleDetailRowClick = async data => {
    
        console.log("handleDetailRowClick cliked on row: ",data.index);

        this.setState({
            indexOfDetailLogRow: data.index
        });

       

        this.isDetailDialogOpen.value = true;

        // if(this.state.tableItemDetail)
        // console.log("Info in detail popup: ",this.state.tableItemDetail.value[data.index].tasks[data.index]);

        // console.log("Index of detail row in state: ", this.state.indexOfDetailLogRow);

        // if(this.state.tableItemDetail)
        // console.log("Date info: ", this.state.tableItemDetail[data.index].tasks[data.index].Date)
        
    }
         
             

       
          


        return (
            
         
            <div>
                
                {
                    // this.state.hasDuplicatedChecksum &&
                    
                    // <Toast
                    // ref={this.toastRef}
                    // message="Duplicated file found!"
                    // callToAction="Cancel"
                    // onCallToActionClick={() => this.setState({hasDuplicatedChecksum: false})}
                    // />
                
                }
                {
                    // this.state.addFileSuccess &&
                    
                    // <Toast
                    // ref={this.toastRef}
                    // message="Submitted successfully!"
                    // callToAction="Cancel"
                    // onCallToActionClick={() => this.setState({addFileSuccess: false})}
                    // />
                
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
                          selection={this.selection}
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
                         <Table ariaLabel="Basic Table" columns={fixedColumnsDetail} itemProvider={this.state.tableItemDetail} role="table" 
                         onSelect={(event, data) => handleDetailRowClick(data)}
                         />
                    </Card>
                </div>
                :   
                // <p>Nothing</p>
                <MessageCard
                className="flex-self-stretch" 
                severity={MessageCardSeverity.Info}
                >
                Please click a log to show the detail
                </MessageCard>
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

                <Observer isDetailDialogOpen={this.isDetailDialogOpen}>
                    {(props: { isDetailDialogOpen: boolean }) => {
                        return props.isDetailDialogOpen ? (
                            <Dialog
                                titleProps={{ text: "Detail Infomation" }}
                                footerButtonProps={[
                                    {
                                        text: "Cancel",
                                        onClick: onDetailDismiss
                                    }
                                ]}
                                onDismiss={onDetailDismiss}
                                
                                
                            >
                             
                             {
                                 (this.state.tableItemDetail && this.state.indexOfDetailLogRow === 0) || (this.state.tableItemDetail && this.state.indexOfDetailLogRow) ?
                                 <div>Id: {this.state.tableItemDetail.value[this.state.indexOfDetailLogRow].tasks[this.state.indexOfDetailLogRow].id.toString()}</div> 
                                 : <p>Id: N/A</p>
                             }
                             {
                                 (this.state.tableItemDetail && this.state.indexOfDetailLogRow === 0) || (this.state.tableItemDetail && this.state.indexOfDetailLogRow) ?
                                 <div>Date: {this.state.tableItemDetail.value[this.state.indexOfDetailLogRow].tasks[this.state.indexOfDetailLogRow].Date.toString()}</div> 
                                 : <p>Date: N/A</p>
                             }
                            {
                                 (this.state.tableItemDetail && this.state.indexOfDetailLogRow === 0) || (this.state.tableItemDetail && this.state.indexOfDetailLogRow) ?
                                 <div>User: {this.state.tableItemDetail.value[this.state.indexOfDetailLogRow].tasks[this.state.indexOfDetailLogRow].User.toString()}</div> 
                                 : <p>User: N/A</p>
                             }
                             {
                                 (this.state.tableItemDetail && this.state.indexOfDetailLogRow === 0) || (this.state.tableItemDetail && this.state.indexOfDetailLogRow) ?
                                 <div>Condition: {this.state.tableItemDetail.value[this.state.indexOfDetailLogRow].tasks[this.state.indexOfDetailLogRow].condition.toString()}</div> 
                                 : <p>Condition: N/A</p>
                             }
                             {
                                 (this.state.tableItemDetail && this.state.indexOfDetailLogRow === 0) || (this.state.tableItemDetail && this.state.indexOfDetailLogRow) ?
                                 <div>Status: {this.state.tableItemDetail.value[this.state.indexOfDetailLogRow].tasks[this.state.indexOfDetailLogRow].status.toString()}</div> 
                                 : <p>Status: N/A</p>
                             }
                             {
                                 (this.state.tableItemDetail && this.state.indexOfDetailLogRow === 0) || (this.state.tableItemDetail && this.state.indexOfDetailLogRow) ?
                                 <div>Steps: {this.state.tableItemDetail.value[this.state.indexOfDetailLogRow].tasks[this.state.indexOfDetailLogRow].steps.toString()}</div> 
                                 : <p>Steps: N/A</p>
                             }
                            
                            </Dialog>
                        ) : null;
                    }}
                </Observer>


                </div>
           
           
        );
    }


  
}

showRootComponent(<PivotContent />);
