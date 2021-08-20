import React, {useRef, useState, useEffect,useContext, createContext} from 'react';
import {makeStyles, CircularProgress, Grid} from '@material-ui/core';


import cogoToast from 'cogo-toast';
import {createSorter} from '../../../js/Sort';

import Util from '../../../js/Util';
import Settings from '../../../js/Settings';


//Page Panels
//import InvOrdersInContainer from './Inv_OrdersIn/InvOrdersInContainer';
import _ from 'lodash';
import { ProfileContext } from '../ProfileContainer';
import ProfileMainBasicInfo from './ProfileMainBasicInfo';


export const SubContext = createContext(null);

//This is the highest component for the Profile Page
//Contains all important props that all tabs use
const ProfileMainContainer = function(props) {
  const {user} = props;

  const { currentView,setCurrentView} = useContext(ProfileContext);

  const classes = useStyles();

  const [resetWOIForm, setResetWOIForm] = useState(false);
  const [basicInfoObject, setBasicInfoObject] = useState(null);
  const [basicInfoObjectRefetch, setBasicInfoObjectRefetch] = useState(false);

  return (
    <div className={classes.root}>
      <SubContext.Provider value={{resetWOIForm, setResetWOIForm, basicInfoObject, setBasicInfoObjectRefetch ,setBasicInfoObject} } >
      
        <div className={classes.containerDiv}>
            <div className={classes.profileHead}>
                    <img className={classes.picDiv} height="168px" width="168px" src="/static/rainey_elec.png"/>
            </div>

            <div>
              <ProfileMainBasicInfo />
            </div>

        </div>
      </SubContext.Provider>
    </div>
  );
}

export default ProfileMainContainer

const useStyles = makeStyles(theme => ({
  root:{
    background: '#ddd',
    //padding: '1% 2%',
  },
  containerDiv:{
    backgroundColor: '#fafafa',
    marginTop: '5px',
    padding: "1%",
    borderRadius: '2px',
    
  },
  mainPanel:{
    // boxShadow: 'inset 0px 2px 4px 0px #a7a7a7',
    // backgroundColor: '#e7eff8'
  },
  picDiv:{
    margin: '5px',
    border: '1px solid #d1d1d1',
    boxShadow: '0px 0px 5px 1px #c4c4c4',
    borderRadius: '50%',
  },
  profileHead:{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  }
}));