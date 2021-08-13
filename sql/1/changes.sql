/* 1 */
DROP PROCEDURE IF EXISTS initial_setup;

DELIMITER $$

CREATE DEFINER=CURRENT_USER PROCEDURE initial_setup ( ) 
BEGIN

DECLARE tableName TEXT;
SELECT table_name INTO tableName
FROM information_schema.tables
WHERE table_schema = 'collabnation'
    AND table_name ='google_token';


IF tableName is null THEN

    CREATE TABLE `google_token` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `accessToken` varchar(200) DEFAULT NULL,
        `refreshToken` varchar(200) DEFAULT NULL,
        `tokenType` varchar(100) DEFAULT NULL,
        `expiryDate` int(11) DEFAULT NULL,
        PRIMARY KEY (`id`)
    );

    CREATE TABLE `google_users` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `googleId` varchar(200) NOT NULL,
        `googleTokenId` int(11) NOT NULL,
        `slug` varchar(120) NOT NULL,
        `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `email` varchar(150) NOT NULL,
        `isAdmin` tinyint(1) DEFAULT '0',
        `displayName` varchar(120) DEFAULT 'User',
        `avatarUrl` varchar(240) DEFAULT 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=128',
        `bouncieToken` varchar(350) DEFAULT NULL,
        `bouncieAuthCode` varchar(350) DEFAULT NULL,
        `bouncieExpiresAt` datetime DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `googleId` (`googleId`),
        KEY `FK_google_token_id` (`googleTokenId`),
        CONSTRAINT `FK_google_token_id` FOREIGN KEY (`googleTokenId`) REFERENCES `google_token` (`id`) ON DELETE CASCADE
    );

    CREATE TABLE `sessions` (
        `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        `expires` int(11) unsigned NOT NULL,
        `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
        PRIMARY KEY (`session_id`)
    );

END IF;

END$$

DELIMITER ;

CALL initial_setup;

DROP PROCEDURE initial_setup;

