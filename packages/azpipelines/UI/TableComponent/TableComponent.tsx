import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { showRootComponent } from "../Common";

import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Button } from "azure-devops-ui/Button";
import { Dialog } from "azure-devops-ui/Dialog";
import { Observer } from "azure-devops-ui/Observer";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Card } from "azure-devops-ui/Card";


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

export default class TableComponent extends React.Component {
    constructor(props) { 
        super(props);
    }
    public render(): JSX.Element {
        
        return (
            <Card className="flex-grow bolt-table-card" contentProps={{ contentPadding: false }}>
                <Table ariaLabel="Basic Table" columns={fixedColumns} itemProvider={tableItemsNoIcons} role="table" />
            </Card>
        );
    }
}