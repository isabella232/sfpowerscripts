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
    dateIdentifier?: any,
    mode?:any
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
//const fakeURL = currentUrl;
const fakeURL = "https://safebot.visualstudio.com/sfpowerreview/_releaseProgress?releaseId=160&environmentId=298&extensionId=AzlamSalam.sfpowerscripts-dev.release-tab&_a=release-environment-extension";
const fakeURL2 = "https://safebot.visualstudio.com/sfpowerreview/_releaseProgress?releaseId=79&environmentId=298&extensionId=AzlamSalam.sfpowerscripts-dev.release-tab&_a=release-environment-extension";

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


        console.log("Current window location: ", currentUrl);

        console.log("Date: ", Date.now());
      
       

        const urlParams = new URL(fakeURL);
        const releaseId = urlParams.searchParams.get('releaseId');
        const environmentId = urlParams.searchParams.get('environmentId');
        console.log("url params: ",urlParams);
        console.log("release id: ",releaseId);
        console.log("environment id: ",environmentId);
    
        if(releaseId && environmentId) {

        let release = await getClient(ReleaseRestClient).getRelease(projectId, Number(releaseId));
        
        //let release2 = await getClient(ReleaseRestClient).getRelease(projectId, Number("79"));

        console.log("Release info: ", release);

        console.log("Release difinition Id: ",);

        
        let masterDocumentId = "RunBook" + "_" + releaseId + "_" + environmentId;//RunBook_ReleaseId_EnvId

        console.log("Mater document Id: ", masterDocumentId);
        //let documentId = "79"
       // console.log("Doc Id: ", documentId);//Release-62_160_298//runbookname+version+releaseId+envId//relId_envId_runbookname_
        //get document based on document Id (release Id)

        //let docsdelete = await getClient(ExtensionManagementRestClient).deleteDocumentByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement","RunBook_160_298");//sfpowersciptextenlog
        //master documents
        let docs = await getClient(ExtensionManagementRestClient).getDocumentsByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement");//sfpowersciptextenlog


        
        console.log("Documents of ReleaseExtensionManagement: ", docs);

        

        for(let i=0; i<docs.length; i++) {

           
            let indexes = this.locations(docs[i].id, '_');
            //find last '_' position
            let lastWildCardPosition = indexes[indexes.length-1];
            let secondToLastWildCardPosition = indexes[indexes.length-2];

            //other doc releaseId and envId
            let envIdOther = docs[i].id.substring(lastWildCardPosition+1, docs[i].id.length);
            let releaseIdOther = docs[i].id.substring(secondToLastWildCardPosition+1, lastWildCardPosition);

            console.log("Environment Id: ", envIdOther);
            console.log("Release Id: ", releaseIdOther);

            console.log("Document Id is: ", docs[i].id);
            console.log("Master doc Id is: ", masterDocumentId);



            /*
            * TO DO: Think about different pipelines situation
            */


          

            //in one pipeline, different release with same envId
            if(envIdOther == environmentId && docs[i].id != masterDocumentId) {

                console.log("different release with same envId", docs[i]);
                let release = await getClient(ReleaseRestClient).getRelease(projectId, Number(releaseId)); 
                let releaseOther = await getClient(ReleaseRestClient).getRelease(projectId, Number(releaseIdOther));

                //if this release is created after other releases (subsequent release)
                if(releaseOther.createdOn < release.createdOn) {

                    for(let k=0; k<docs[i].children.length; k++) {
                        
                        for(let j=0; j<docs[i].children[k].executionLogs.length; j++){
                            if(docs[i].children[k].executionLogs[j].logInfo.tableItems.items[0].mode == "run-once") {
                                console.log("Run-once added!");
                                //this.rawTableItems = [...this.rawTableItems,docs[i].children[k].executionLogs[j].logInfo.tableItems.items[0]];
                               

                                let childDoc = docs[i].children[k];


                                let docsNew = await getClient(ExtensionManagementRestClient).getDocumentsByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement");//sfpowersciptextenlog
                                for(let m=0; m<docsNew.length; m++) {
                                    if(docsNew[m].id != masterDocumentId && m==docsNew.length-1) {
                                        let masterDocumentId = "RunBook" + "_" + releaseId + "_" + environmentId;//RunBook_ReleaseId_EnvId

                                        let masterDocToBeSent = {
                                            id: masterDocumentId,
                                            children: [
                                                 {
                                                     runbook: childDoc.runbook,
                                                     lastUpdated: childDoc.lastUpdated,
                                                     executionLogs: [childDoc.executionLogs[j]]
                                                 }
                                            ]
                                            
                                        }
                                        let masterDocument = await getClient(ExtensionManagementRestClient).createDocumentByName(masterDocToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");
                                        break;
                                    }

                                    if(docsNew[m].id == masterDocumentId) {

                                        let masterDoc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", masterDocumentId);

                                        for(let n=0; n<masterDoc.children.length; n++) {

                                            if(masterDoc.children[n].runbook == childDoc.runbook) {
                                              //console.log("Matesttttttttttttt....", masterDoc.children[n].executionLogs);
                                                if(masterDoc.children[n].lastUpdated < childDoc.lastUpdated) {
                                                    masterDoc.children[n].lastUpdated = childDoc.lastUpdated;
                                                    console.log("testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest");
                                                    masterDoc.children[n].executionLogs.push(docs[i].children[k].executionLogs[j]);
                                                }

                                                //masterDoc.children[n].executionLogs.push(docs[i].children[k].executionLogs[j]);
        
                                               
                                                
                                                break;
                                            }
                    
                                            if((masterDoc.children[n].runbook != childDoc.runbook) && (n == masterDoc.children.length-1)) {
                    
                                                let child  = {
                                                    runbook: childDoc.runbook,
                                                    lastUpdated: childDoc.lastUpdated,
                                                    executionLogs: [childDoc.executionLogs[j]]
                                                }
                    
                                                 masterDoc.children.push(child);
                                                break;
                                            }
                                        }
                    
                                        let masterDocToBeSent = {
                                            __etag: masterDoc.__etag,
                                            id: masterDoc.id,
                                            children: masterDoc.children
                                        }
                    
                                        let masterDocument = await getClient(ExtensionManagementRestClient).setDocumentByName(masterDocToBeSent,PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE,"ReleaseExtensionManagement");
                    
                                        break;
                                    }
                                }


                            }
                            
                        }

                    }


                }


            }


            if(docs[i].id == masterDocumentId) {

                console.log("same release");
                let masterDoc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", masterDocumentId);

                for(let i=0; i<masterDoc.children.length; i++) {
                    for(let j=0; j<masterDoc.children[i].executionLogs.length;j++) {
                        this.rawTableItems = [...this.rawTableItems, ...masterDoc.children[i].executionLogs[j].logInfo.tableItems.items];
                    }
                }
        
                
    
            
            }



        }



        // let docsNew = await getClient(ExtensionManagementRestClient).getDocumentsByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement");//sfpowersciptextenlog

        // for(let i=0; i<docsNew.length;i++) {
        //     if(docsNew[i].id == masterDocumentId) {

        //         console.log("same release");
        //         let masterDoc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", masterDocumentId);

        //         for(let i=0; i<masterDoc.children.length; i++) {
        //             for(let j=0; j<masterDoc.children[i].executionLogs.length;j++) {
        //                 this.rawTableItems = [...this.rawTableItems, ...masterDoc.children[i].executionLogs[j].logInfo.tableItems.items];
        //             }
        //         } 
        //     }

            
        // }

        
       
        console.log("Raw table items: ", this.rawTableItems);

        this.setState(preState => {
            return {
                tableItems: new ArrayItemProvider(this.rawTableItems)
            }
        });
    
    }
      

        console.log("State in initializeComponent: ", this.state);

       // return doc;
  
       
      // let docsdelete = await getClient(ExtensionManagementRestClient).deleteDocumentByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement","RunBook_160_298");//sfpowersciptextenlog
    }


    //helper function
    private locations(str,char) {
        return str
         .split("")
         .map(function (c, i) { if (c == char) return i; })
         .filter(function (v) { return v >= 0; });
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
        // let release = await getClient(ReleaseRestClient).getRelease(projectId, Number(releaseId));
        // let releaseName = release.name;

        
        //let documentId = releaseName + '_' + releaseId + '_' + environmentId;

        //all documents in the collection
        let docs = await getClient(ExtensionManagementRestClient).getDocumentsByName(PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE, "ReleaseExtensionManagement");


        //no master doc, no child doc

        //has master doc, has child doc



        if(docs.length == 0) {
            //No document initially, no master doc, no child doc
            let logInfoItem = {
                tableItems:  self.tableItemsNewlyAdded,
                tableItemDetail: self.tableItemsDetail
            }
    
            let logInfo = logInfoItem;

            //-------create child doc Start-----------
            let childDocumentId = self.rawTableItemsNewlyAdded[0].name + "_" + releaseId + "_" + environmentId + "_" + self.rawTableItemsNewlyAdded[0].dateIdentifier;//runbookname_releaseId_EnvId_timestamp
            let docToBeSent = {
                id: childDocumentId,
                logInfo: logInfo
            }
           //let document = await getClient(ExtensionManagementRestClient).createDocumentByName(docToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");
           //-------create child doc End-----------

           //console.log("First Document Created: ", document);

           //-------create Mater doc Start-----------
           let masterDocumentId = "RunBook" + "_" + releaseId + "_" + environmentId;//RunBook_ReleaseId_EnvId

           let masterDocToBeSent = {
               id: masterDocumentId,
               children: [
                    {
                        runbook: self.rawTableItemsNewlyAdded[0].name,
                        lastUpdated: self.rawTableItemsNewlyAdded[0].dateIdentifier,
                        executionLogs: [docToBeSent]
                    }
               ]
               
           }
           let masterDocument = await getClient(ExtensionManagementRestClient).createDocumentByName(masterDocToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");

           console.log("Mater document created: ", masterDocument);
           //-------create Master doc End-----------

          

           //update state
            this.setState({
                tableItems: self.tableItems,
                tableItemDetail: self.tableItemsDetail,
                addFileSuccess: true
            });


        }else {

            //get master doc Id
            let masterDocumentId = "RunBook" + "_" + releaseId + "_" + environmentId;//RunBook_ReleaseId_EnvId

            //get child doc Id
            let childDocumentId = self.rawTableItemsNewlyAdded[0].name + "_" + releaseId + "_" + environmentId + "_" + self.rawTableItemsNewlyAdded[0].dateIdentifier;//runbookname_releaseId_EnvId_timestamp
             
            for(let i=0; i<docs.length; i++) {
            
                //find master doc
                if(docs[i].id == masterDocumentId) {
                    let masterDoc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", masterDocumentId);

                    let logInfoItem = {
                        tableItems:  self.tableItemsNewlyAdded,
                        tableItemDetail: self.tableItemsDetail
                    }

                    let childDoc = {
                        id: childDocumentId,
                        logInfo: logInfoItem
                    }

                    for(let j=0; j<masterDoc.children.length; j++) {
                        if(masterDoc.children[j].runbook == self.rawTableItemsNewlyAdded[0].name) {
                            masterDoc.children[j].lastUpdated = self.rawTableItemsNewlyAdded[0].dateIdentifier;
                            masterDoc.children[j].executionLogs.push(childDoc);
                            break;
                        }

                        if((masterDoc.children[j].runbook != self.rawTableItemsNewlyAdded[0].name) && (j == masterDoc.children.length-1)) {

                            let child  = {
                                runbook: self.rawTableItemsNewlyAdded[0].name,
                                lastUpdated: self.rawTableItemsNewlyAdded[0].dateIdentifier,
                                executionLogs: [childDoc]
                            }

                            masterDoc.children.push(child);
                            break;
                        }
                    }

                    let masterDocToBeSent = {
                        __etag: masterDoc.__etag,
                        id: masterDoc.id,
                        children: masterDoc.children
                    }

                    let masterDocument = await getClient(ExtensionManagementRestClient).setDocumentByName(masterDocToBeSent,PUBLISHER_NAME,EXTENSION_NAME,SCOPE_TYPE,SCOPE_VALUE,"ReleaseExtensionManagement");

                    //set the state
                    let docAfterUpdate = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", masterDocumentId);

                    console.log("After updated master doc: ", docAfterUpdate);

                    let rawTableItems: ITableItem[] = [];
                    let rawTableItemsDetail: ITableItemDetail[] = [];

                    for(let j=0; j<docAfterUpdate.children.length; j++) {

                        for(let k=0; k<docAfterUpdate.children[j].executionLogs.length; k++) {
                            rawTableItems = [...docAfterUpdate.children[j].executionLogs[k].logInfo.tableItems.items, ...rawTableItems];
                            rawTableItemsDetail = [...docAfterUpdate.children[j].executionLogs[k].logInfo.tableItemDetail.items, ...rawTableItemsDetail];
                        }

                        // rawTableItems = [...docAfterUpdate.logInfo[j].tableItems.items, ...rawTableItems];
                        // rawTableItemsDetail = [...docAfterUpdate.logInfo[j].tableItemDetail.items, ...rawTableItemsDetail];         
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



                if((docs[i].id != masterDocumentId) && (i == docs.length-1)) {
                    let logInfoItem = {
                        tableItems:  self.tableItemsNewlyAdded,
                        tableItemDetail: self.tableItemsDetail
                    }

                    let childDoc = {
                        id: childDocumentId,
                        logInfo: logInfoItem
                    }

                    let masterDocToBeSent = {
                        id: masterDocumentId,
                        children: [
                             {
                                 runbook: self.rawTableItemsNewlyAdded[0].name,
                                 lastUpdated: self.rawTableItemsNewlyAdded[0].dateIdentifier,
                                 executionLogs: [childDoc]
                             }
                        ]
                        
                    }

                    let document = await getClient(ExtensionManagementRestClient).createDocumentByName(masterDocToBeSent, PUBLISHER_NAME, EXTENSION_NAME,SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement");
                    console.log("New Master Document Created: ", document);
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

                        let mode = data.mode;

                        const dateIdentifier = Date.now();


                        self.rawTableItems.push({
                            name:name,
                            author:author,
                            time:time,
                            checksum: data.checksum,
                            dateIdentifier: dateIdentifier,
                            mode: mode
                        });


                        self.rawTableItemsNewlyAdded = [];
                        self.rawTableItemsNewlyAdded.push({
                            name:name,
                            author:author,
                            time:time,
                            checksum: data.checksum,
                            dateIdentifier: dateIdentifier,
                            mode: mode
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

        console.log("On row click data: ", d);

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
        // let release = await getClient(ReleaseRestClient).getRelease(projectId, Number(releaseId));
        // let releaseName = release.name;
        //let documentId = releaseName + '_' + releaseId + '_' + environmentId;
        let masterDocumentId = "RunBook" + "_" + releaseId + "_" + environmentId;//RunBook_ReleaseId_EnvId
         //get master docs
         let doc = await getClient(ExtensionManagementRestClient).getDocumentByName(PUBLISHER_NAME, EXTENSION_NAME, SCOPE_TYPE, SCOPE_VALUE, "ReleaseExtensionManagement", masterDocumentId);
 
         console.log("Doc on handleClick: ", doc);

         let detailItemTobeDisplayed: ITableItemDetail[] = [];

         
           
            for(let j=0; j<doc.children.length; j++) {
                console.log("Should add##########out2");
                for(let k=0; k<doc.children[j].executionLogs.length; k++) {
                    console.log("Should add##########out3");
                    for(let m=0; m<doc.children[j].executionLogs[k].logInfo.tableItemDetail.items.length; m++) {
                        console.log("Should add##########out4");
                        if(doc.children[j].executionLogs[k].logInfo.tableItemDetail.items[m].dateIdentifier.toString() === dateIdentifier.toString()) {
                            detailItemTobeDisplayed = [...detailItemTobeDisplayed, doc.children[j].executionLogs[k].logInfo.tableItemDetail.items[m]];
                            console.log("Should add##########");
                        }
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
