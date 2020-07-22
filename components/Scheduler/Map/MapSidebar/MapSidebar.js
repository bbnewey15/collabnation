import React, {useRef, useState, useEffect} from 'react';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ListIcon from '@material-ui/icons/List';
import VisiblityOffIcon from '@material-ui/icons/VisibilityOff';
import { Scrollbars} from 'react-custom-scrollbars';
import {makeStyles, Paper, ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary} from '@material-ui/core'

import MapSidebarMissingMarkers from './MapSidebarMissingMarkers';
import MapSidebarMarkedTasks from './MapSidebarMarkedTasks';
import MapSidebarTaskList from './MapSidebarTaskList';

const MapSidebar = (props) => {
    //STATE
    const [expanded, setExpanded] = React.useState(false);

    const panelRef = useRef(null);

    //PROPS
    const {mapRows, setMapRows, noMarkerRows,markedRows, activeMarker, setActiveMarker, 
            setShowingInfoWindow, setModalOpen, setModalTaskId, setResetBounds} = props;

    useEffect( () =>{ //useEffect for inputText
        if(activeMarker && activeMarker.geocoded)
            setExpanded('panel1');
        return () => { //clean up
            if(activeMarker){
                
            }
        }
    },[activeMarker]);
    
    //CSS
    const classes = useStyles();

    //FUNCTIONS
    const handleChange = panel => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };
     
    return(
        <Paper className={classes.root}>
            <Paper className={classes.head}>
                <MapSidebarTaskList {...props} />
                
            </Paper>
            <ExpansionPanel expanded={expanded === 'panel1'} onChange={handleChange('panel1')} className={classes.body } >
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1bh-content"
                    id="panel1bh-header"
                ><ListIcon className={classes.icon}/><span>Mapped Markers:&nbsp;&nbsp;{markedRows.length} Items</span>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails ref={panelRef} className={classes.details}>
                    <Scrollbars universal autoHeight autoHeightMax={400}>
                        <MapSidebarMarkedTasks {...props} panelRef={panelRef}
                                                />
                    </Scrollbars>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            { noMarkerRows && noMarkerRows.length >0  ? 
            <ExpansionPanel expanded={expanded === 'panel2'} onChange={handleChange('panel2')} className={classes.body} 
                classes={noMarkerRows && noMarkerRows.length > 0 ? {root: classes.attention} : {}}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1bh-content"
                    id="panel1bh-header"
                ><VisiblityOffIcon className={classes.icon}/><span>Unmapped Markers:&nbsp;&nbsp;{noMarkerRows.length} Items</span>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails className={classes.details} >
                    <Scrollbars universal autoHeight autoHeightMax={400} style={{marginLeft: '20px'}}>
                        <MapSidebarMissingMarkers {...props}/>
                    </Scrollbars>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            :<></>}

        </Paper>
    );

} 

export default MapSidebar;

const useStyles = makeStyles(theme => ({
    root: {
        padding: '1% 2% 2% 2%',
        margin: '0px 0px 0px -90px',
        background: 'linear-gradient( #dadada, #a2a2a2)',
        boxShadow: '0px 1px 8px 0px rgba(0,0,0,0.52)',
        minHeight: '400px',
    },
    head: {
        padding: '1% 2% 1% 2%',
        color: '#fff',
        backgroundColor: '#16233b',
        fontSize: '30px',
        fontWeight: '400',
        display: 'block',
    },
    body:{
        padding: '1% 1% 1% 1%',
        margin: '0',
        fontWeight: '400',
        fontSize: 'larger',

        maxHeight: '800px',
    },
    details:{
        padding: '2px 8px 8px 6px'
    },
    attention:{
        color: 'red'
    },
    icon:{
        margin: '1px 12px 1px 1px',
        color: '#a0a0a0',
    },
  }));