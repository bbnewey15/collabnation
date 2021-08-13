import React, { useEffect , useState} from 'react'
import PropTypes from 'prop-types';

import MainLayout from '../components/Layouts/Main';
import withAuth from '../server/lib/withAuth';

import ProfileContainer from '../components/Profile/ProfileContainer';


const Index = function (props) {
    
    const {user} = props;

    return (
        <MainLayout>
               <ProfileContainer user={user}/> 
        </MainLayout>
    );
}

//does work when were being passed props 
// Index.getInitialProps = async ({ query }) => ({ settings: query.settings });

// Index.propTypes = {
//   settings: PropTypes.shape({
//     results: PropTypes.array.isRequired,
//   }),
// };

Index.defaultProps = {
  settings: null,
};

export default withAuth(Index);