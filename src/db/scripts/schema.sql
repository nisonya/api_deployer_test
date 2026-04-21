-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: kvant
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `access_level`
--

DROP TABLE IF EXISTS `access_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_level` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `discription` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id_student` int NOT NULL,
  `id_group` int NOT NULL,
  `date_of_lesson` date NOT NULL,
  `presence` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id_student`,`id_group`,`date_of_lesson`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `link` varchar(230) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id_employees` int unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(45) NOT NULL,
  `second_name` varchar(45) NOT NULL,
  `patronymic` varchar(45) DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `position` int unsigned DEFAULT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `size` varchar(10) DEFAULT NULL,
  `education` varchar(30) DEFAULT NULL,
  `schedule` varchar(100) DEFAULT 'Основной график',
  `gender` varchar(1) DEFAULT NULL,
  `KPI` varchar(250) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_employees`),
  KEY `id_idx` (`position`),
  CONSTRAINT `position_key` FOREIGN KEY (`position`) REFERENCES `position` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `employees_BEFORE_INSERT` BEFORE INSERT ON `employees` FOR EACH ROW BEGIN
IF(new.contact != '') then
If( new.contact not regexp '^((8|\\+7)[\\- ]?)?(\\(?\\d{3}\\)?[\\- ]?)?[\\d\\- ]{7,10}$') then
signal SQLSTATE VALUE '45000' SET MESSAGE_TEXT = 'Incorrect phone mask';
end if;
end if;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `employees_BEFORE_UPDATE` BEFORE UPDATE ON `employees` FOR EACH ROW BEGIN
IF(new.contact != '') then
If( new.contact not regexp '^((8|\\+7)[\\- ]?)?(\\(?\\d{3}\\)?[\\- ]?)?[\\d\\- ]{7,10}$') then
signal SQLSTATE VALUE '45000' SET MESSAGE_TEXT = 'Incorrect phone mask';
end if;
end if;
IF NEW.is_active = 0 AND OLD.is_active = 1 THEN
    DELETE FROM profile WHERE employee_id = OLD.id_employees;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `employees_BEFORE_DELETE` BEFORE DELETE ON `employees` FOR EACH ROW BEGIN
SET SQL_SAFE_UPDATES = 0;
	DELETE FROM `profile`                     WHERE `employee_id` = OLD.id_employees;
	DELETE FROM `employees_schedule`          WHERE `idEmployees` = OLD.id_employees;
	DELETE FROM `responsible_for_org_events`  WHERE `id_employee` = OLD.id_employees;
	DELETE FROM `responsible_for_part_events` WHERE `id_employee` = OLD.id_employees;
SET SQL_SAFE_UPDATES = 1;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `employees_schedule`
--

DROP TABLE IF EXISTS `employees_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees_schedule` (
  `idEmployees` int unsigned NOT NULL,
  `idSchedule` int unsigned NOT NULL,
  `room` int unsigned DEFAULT NULL,
  PRIMARY KEY (`idEmployees`,`idSchedule`),
  KEY `employes_idx` (`idEmployees`),
  KEY `schedule_idx` (`idSchedule`),
  KEY `room_idx` (`room`),
  CONSTRAINT `employes` FOREIGN KEY (`idEmployees`) REFERENCES `employees` (`id_employees`),
  CONSTRAINT `room` FOREIGN KEY (`room`) REFERENCES `room` (`id`),
  CONSTRAINT `schedule` FOREIGN KEY (`idSchedule`) REFERENCES `schedule` (`idlesson`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `employees_schedule_BEFORE_INSERT` BEFORE INSERT ON `employees_schedule` FOR EACH ROW BEGIN
  DECLARE v_start TIME;
  DECLARE v_end TIME;
  DECLARE v_day INT UNSIGNED;
  DECLARE v_group INT UNSIGNED;
  DECLARE v_pos INT UNSIGNED;

  SELECT s.startTime, s.endTime, s.`day`, s.`group`
    INTO v_start, v_end, v_day, v_group
  FROM schedule s
  WHERE s.idlesson = NEW.idSchedule;

  SELECT e.`position` INTO v_pos FROM employees e WHERE e.id_employees = NEW.idEmployees LIMIT 1;

  IF v_pos IS NULL OR v_pos <> 2 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Сотрудник не является преподавателем (нужна должность с position = 2).';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM schedule s
    WHERE s.idlesson <> NEW.idSchedule
      AND s.`day` = v_day
      AND s.`group` = v_group
      AND (
        (v_start >= s.startTime AND v_start < s.endTime) OR
        (v_end > s.startTime AND v_end <= s.endTime) OR
        (s.startTime >= v_start AND s.startTime < v_end) OR
        (s.endTime > v_start AND s.endTime <= v_end)
      )
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'У группы в этот день уже есть занятие, пересекающееся по времени.';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `event_plan_organization`
--

DROP TABLE IF EXISTS `event_plan_organization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_plan_organization` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(110) NOT NULL,
  `form_of_holding` varchar(60) DEFAULT NULL,
  `dates_of_event` date DEFAULT NULL,
  `day_of_the_week` varchar(23) DEFAULT NULL,
  `amount_of_applications` int unsigned DEFAULT NULL,
  `amount_of_planning_application` int unsigned DEFAULT NULL,
  `annotation` text,
  `result` varchar(110) DEFAULT NULL,
  `type` int unsigned DEFAULT NULL,
  `link` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `type_idx` (`type`),
  CONSTRAINT `type` FOREIGN KEY (`type`) REFERENCES `types_of_organization` (`id_type`)
) ENGINE=InnoDB AUTO_INCREMENT=253 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `event_plan_organization_BEFORE_UPDATE` BEFORE UPDATE ON `event_plan_organization` FOR EACH ROW BEGIN
SET SQL_SAFE_UPDATES = 0;
if(DATE(old.dates_of_event)!=DATE(new.dates_of_event)) THEN BEGIN
	DELETE FROM `kvant`.`rent` WHERE `id_event` = OLD.id;
END; END IF;
SET SQL_SAFE_UPDATES = 1;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `event_plan_organization_BEFORE_DELETE` BEFORE DELETE ON `event_plan_organization` FOR EACH ROW BEGIN
SET SQL_SAFE_UPDATES = 0;
	DELETE FROM `kvant`.`responsible_for_org_events` WHERE `id_event` = OLD.id;
	DELETE FROM `kvant`.`rent` WHERE `id_event` = OLD.id;
SET SQL_SAFE_UPDATES = 1;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `event_plan_participation`
--

DROP TABLE IF EXISTS `event_plan_participation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_plan_participation` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(110) NOT NULL,
  `form_of_holding` int unsigned DEFAULT NULL,
  `id_type` int unsigned NOT NULL DEFAULT '1',
  `registration_deadline` date DEFAULT NULL,
  `participants_and_works` varchar(210) DEFAULT NULL,
  `result` varchar(180) DEFAULT NULL,
  `annotation` text,
  `dates_of_event` varchar(110) DEFAULT NULL,
  `link` text,
  `participants_amount` int unsigned DEFAULT NULL,
  `winner_amount` int unsigned DEFAULT NULL,
  `runner_up_amount` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `frorm_key_idx` (`form_of_holding`),
  KEY `type_idx` (`id_type`),
  CONSTRAINT `frorm_key` FOREIGN KEY (`form_of_holding`) REFERENCES `form_of_holding` (`id`),
  CONSTRAINT `hgujbu` FOREIGN KEY (`id_type`) REFERENCES `type_of_part_event` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=228 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `event_plan_participation_BEFORE_DELETE` BEFORE DELETE ON `event_plan_participation` FOR EACH ROW BEGIN
SET SQL_SAFE_UPDATES = 0;
	DELETE FROM `kvant`.`responsible_for_part_events` WHERE `id_event` = OLD.id;
SET SQL_SAFE_UPDATES = 1;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `form_of_holding`
--

DROP TABLE IF EXISTS `form_of_holding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_of_holding` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `form_of_holding` (`id`, `name`) VALUES
  (1, 'очно'),
  (2, 'заочно'),
  (3, 'очно/заочно');

--
-- Temporary view structure for view `full_profile`
--

DROP TABLE IF EXISTS `full_profile`;
/*!50001 DROP VIEW IF EXISTS `full_profile`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `full_profile` AS SELECT 
 1 AS `id`,
 1 AS `employee_id`,
 1 AS `name`,
 1 AS `date_of_birth`,
 1 AS `position`,
 1 AS `contact`,
 1 AS `size`,
 1 AS `education`,
 1 AS `schedule`,
 1 AS `gender`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groups` (
  `idGroups` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`idGroups`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `groups_BEFORE_DELETE` BEFORE DELETE ON `groups` FOR EACH ROW BEGIN
Set SQL_SAFE_UPDATES = 0;
delete From `kvant`.`students_groups` where students_groups.idGroup = Old.idGroups;
Set SQL_SAFE_UPDATES = 1;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `pixels`
--

DROP TABLE IF EXISTS `pixels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pixels` (
  `id_student` int unsigned NOT NULL,
  `part_of_comp` int unsigned NOT NULL DEFAULT '0',
  `make_content` int unsigned NOT NULL DEFAULT '0',
  `invite_friend` int unsigned NOT NULL DEFAULT '0',
  `clean_kvantum` int unsigned NOT NULL DEFAULT '0',
  `filled_project_card_on_time` int unsigned NOT NULL DEFAULT '0',
  `finished_project_with_product` int unsigned NOT NULL DEFAULT '0',
  `regional_competition` int unsigned NOT NULL DEFAULT '0',
  `interregional_competition` int unsigned NOT NULL DEFAULT '0',
  `all_russian_competition` int unsigned NOT NULL DEFAULT '0',
  `international_competition` int unsigned NOT NULL DEFAULT '0',
  `nto` int unsigned NOT NULL DEFAULT '0',
  `become_an_engineering_volunteer` int unsigned NOT NULL DEFAULT '0',
  `help_with_event` int unsigned NOT NULL DEFAULT '0',
  `make_own_event` int unsigned NOT NULL DEFAULT '0',
  `special_achievements` int unsigned NOT NULL DEFAULT '0',
  `fine` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_student`),
  CONSTRAINT `st_key` FOREIGN KEY (`id_student`) REFERENCES `students` (`idStudent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `position`
--

DROP TABLE IF EXISTS `position`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `position` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `profile`
--

DROP TABLE IF EXISTS `profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int unsigned NOT NULL,
  `login` varchar(20) NOT NULL,
  `password_hash` varchar(200) NOT NULL,
  `access_level_id` int unsigned NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `login_UNIQUE` (`login`),
  KEY `access_level_key_idx` (`access_level_id`),
  KEY `employee_key3_idx` (`employee_id`),
  CONSTRAINT `access_level_key` FOREIGN KEY (`access_level_id`) REFERENCES `access_level` (`id`),
  CONSTRAINT `employee_key3` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id_employees`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `profile_BEFORE_INSERT` BEFORE INSERT ON `profile` FOR EACH ROW BEGIN
   DECLARE numLength INT;
   SET numLength = (SELECT LENGTH(NEW.login));
   IF (numLength < 6) THEN
	 signal sqlstate '45000'
            set message_text = 'Login is too short';
   END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `profile_BEFORE_UPDATE` BEFORE UPDATE ON `profile` FOR EACH ROW BEGIN
 DECLARE numLength INT;
   SET numLength = (SELECT LENGTH(NEW.login));
   IF (numLength < 6) THEN
	 signal sqlstate '45000'
            set message_text = 'Login is too short';
   END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `profile_BEFORE_DELETE` BEFORE DELETE ON `profile` FOR EACH ROW BEGIN
	DELETE FROM refresh_tokens
    WHERE profile_id = OLD.id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id_token` int unsigned NOT NULL AUTO_INCREMENT,
  `profile_id` int unsigned NOT NULL,
  `token` text,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id_token`),
  KEY `profile_idx` (`profile_id`),
  CONSTRAINT `profile_key` FOREIGN KEY (`profile_id`) REFERENCES `profile` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rent`
--

DROP TABLE IF EXISTS `rent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rent` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `id_event` int unsigned NOT NULL,
  `id_room` int unsigned NOT NULL,
  `date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_key_idx` (`id_event`),
  KEY `room_key_idx` (`id_room`),
  CONSTRAINT `event_key2` FOREIGN KEY (`id_event`) REFERENCES `event_plan_organization` (`id`),
  CONSTRAINT `room_key` FOREIGN KEY (`id_room`) REFERENCES `room` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=214 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `rent_BEFORE_INSERT` BEFORE INSERT ON `rent` FOR EACH ROW BEGIN
IF (EXISTS(SELECT 1 FROM rent WHERE date = NEW.date 
        and id_room=NEW.id_room 
        and id!=new.id
        and( new.start_time between start_time and end_time 
        or new.end_time between start_time and end_time
        or start_time between new.start_time and new.end_time
        or end_time between new.start_time and new.end_time
        ))) THEN
			SIGNAL SQLSTATE VALUE '45000' SET MESSAGE_TEXT = 'This room is busy during this time';
		END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `rent_BEFORE_UPDATE` BEFORE UPDATE ON `rent` FOR EACH ROW BEGIN
IF (EXISTS(SELECT 1 FROM rent WHERE date = NEW.date 
        and id_room=NEW.id_room 
        and id!=new.id
        and( new.start_time between start_time and end_time 
        or new.end_time between start_time and end_time
        or start_time between new.start_time and new.end_time
        or end_time between new.start_time and new.end_time
        ))) THEN
			SIGNAL SQLSTATE VALUE '45000' SET MESSAGE_TEXT = 'This room is busy during this time';
		END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `responsible_for_org_events`
--

DROP TABLE IF EXISTS `responsible_for_org_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responsible_for_org_events` (
  `id_employee` int unsigned NOT NULL,
  `id_event` int unsigned NOT NULL,
  PRIMARY KEY (`id_employee`,`id_event`),
  KEY `event_idx` (`id_event`),
  CONSTRAINT `empoyee_key` FOREIGN KEY (`id_employee`) REFERENCES `employees` (`id_employees`),
  CONSTRAINT `event_key` FOREIGN KEY (`id_event`) REFERENCES `event_plan_organization` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `responsible_for_part_events`
--

DROP TABLE IF EXISTS `responsible_for_part_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responsible_for_part_events` (
  `id_event` int unsigned NOT NULL,
  `id_employee` int unsigned NOT NULL,
  `mark_of_sending_an_application` tinyint(1) NOT NULL DEFAULT '0',
  `result_of_responsible` varchar(250) DEFAULT NULL,
  `date_of_result` date DEFAULT NULL,
  `responsible_participants` int unsigned DEFAULT NULL COMMENT 'вклад ответственного: участники',
  `responsible_winners` int unsigned DEFAULT NULL COMMENT 'вклад: победители',
  `responsible_runner_up` int unsigned DEFAULT NULL COMMENT 'вклад: призёры',
  PRIMARY KEY (`id_event`,`id_employee`),
  KEY `employee_key_idx` (`id_employee`),
  CONSTRAINT `employee_key1` FOREIGN KEY (`id_employee`) REFERENCES `employees` (`id_employees`),
  CONSTRAINT `event_key1` FOREIGN KEY (`id_event`) REFERENCES `event_plan_participation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `responsible_for_part_events_BEFORE_INSERT` BEFORE INSERT ON `responsible_for_part_events` FOR EACH ROW BEGIN
  IF (
    (NEW.result_of_responsible IS NULL OR TRIM(NEW.result_of_responsible) = '')
    AND NEW.responsible_participants IS NULL
    AND NEW.responsible_winners IS NULL
    AND NEW.responsible_runner_up IS NULL
  ) THEN
    SET NEW.date_of_result = NULL;
  ELSE
    SET NEW.date_of_result = CURRENT_DATE();
  END IF;
END */;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `responsible_for_part_events_BEFORE_UPDATE` BEFORE UPDATE ON `responsible_for_part_events` FOR EACH ROW BEGIN
  IF (
    (NEW.result_of_responsible IS NULL OR TRIM(NEW.result_of_responsible) = '')
    AND NEW.responsible_participants IS NULL
    AND NEW.responsible_winners IS NULL
    AND NEW.responsible_runner_up IS NULL
  ) THEN
    SET NEW.date_of_result = NULL;
  ELSEIF NOT (
    OLD.result_of_responsible <=> NEW.result_of_responsible
    AND OLD.responsible_participants <=> NEW.responsible_participants
    AND OLD.responsible_winners <=> NEW.responsible_winners
    AND OLD.responsible_runner_up <=> NEW.responsible_runner_up
  ) THEN
    SET NEW.date_of_result = CURRENT_DATE();
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `event_organization_document`
--

DROP TABLE IF EXISTS `event_organization_document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_organization_document` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_event` int unsigned NOT NULL,
  `storage_path` varchar(1024) NOT NULL COMMENT 'путь относительно EVENT_DOCUMENTS_ROOT_ORG',
  `original_filename` varchar(255) NOT NULL,
  `mime_type` varchar(128) DEFAULT NULL,
  `size_bytes` bigint unsigned DEFAULT NULL,
  `uploaded_by_profile_id` int unsigned DEFAULT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_eod_event` (`id_event`),
  KEY `fk_eod_profile` (`uploaded_by_profile_id`),
  CONSTRAINT `fk_eod_event` FOREIGN KEY (`id_event`) REFERENCES `event_plan_organization` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eod_profile` FOREIGN KEY (`uploaded_by_profile_id`) REFERENCES `profile` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_participation_document`
--

DROP TABLE IF EXISTS `event_participation_document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_participation_document` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_event` int unsigned NOT NULL,
  `storage_path` varchar(1024) NOT NULL COMMENT 'путь относительно EVENT_DOCUMENTS_ROOT_PART',
  `original_filename` varchar(255) NOT NULL,
  `mime_type` varchar(128) DEFAULT NULL,
  `size_bytes` bigint unsigned DEFAULT NULL,
  `uploaded_by_profile_id` int unsigned DEFAULT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_epd_event` (`id_event`),
  KEY `fk_epd_profile` (`uploaded_by_profile_id`),
  CONSTRAINT `fk_epd_event` FOREIGN KEY (`id_event`) REFERENCES `event_plan_participation` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_epd_profile` FOREIGN KEY (`uploaded_by_profile_id`) REFERENCES `profile` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_part_student_status` (справочник статусов)
--

DROP TABLE IF EXISTS `event_part_student_status`;
CREATE TABLE `event_part_student_status` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `event_part_student` (ученики мероприятия участия)
--

DROP TABLE IF EXISTS `event_part_student`;
CREATE TABLE `event_part_student` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_event` int unsigned NOT NULL,
  `id_student` int unsigned NOT NULL,
  `id_status` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_event_student` (`id_event`, `id_student`),
  KEY `fk_eps_student` (`id_student`),
  KEY `fk_eps_status` (`id_status`),
  CONSTRAINT `fk_eps_event` FOREIGN KEY (`id_event`) REFERENCES `event_plan_participation` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eps_student` FOREIGN KEY (`id_student`) REFERENCES `students` (`idStudent`) ON DELETE CASCADE,
  CONSTRAINT `fk_eps_status` FOREIGN KEY (`id_status`) REFERENCES `event_part_student_status` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `number` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schedule`
--

DROP TABLE IF EXISTS `schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule` (
  `idlesson` int unsigned NOT NULL AUTO_INCREMENT,
  `group` int unsigned NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `day` int unsigned NOT NULL,
  PRIMARY KEY (`idlesson`),
  KEY `group_idx` (`group`),
  KEY `day_idx` (`day`),
  CONSTRAINT `day` FOREIGN KEY (`day`) REFERENCES `weekday` (`idDay`),
  CONSTRAINT `groups` FOREIGN KEY (`group`) REFERENCES `groups` (`idGroups`)
) ENGINE=InnoDB AUTO_INCREMENT=247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `idStudent` int unsigned NOT NULL AUTO_INCREMENT,
  `surnameStudent` varchar(40) NOT NULL,
  `nameStudent` varchar(30) NOT NULL,
  `patronymicStudent` varchar(35) DEFAULT NULL,
  `birthdayStudent` date NOT NULL,
  `navigator` tinyint(1) NOT NULL DEFAULT '0',
  `surnameParent` varchar(40) NOT NULL,
  `nameParent` varchar(30) NOT NULL,
  `patronymicParent` varchar(35) DEFAULT NULL,
  `E-mail` varchar(50) DEFAULT NULL,
  `phone` varchar(18) DEFAULT NULL,
  PRIMARY KEY (`idStudent`)
) ENGINE=InnoDB AUTO_INCREMENT=656 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `students_BEFORE_INSERT` BEFORE INSERT ON `students` FOR EACH ROW BEGIN
IF(new.phone != '') then
If( new.phone not regexp '^((8|\\+7|7)[\\- ]?)?(\\(?\\d{3}\\)?[\\- ]?)?[\\d\\- ]{7,10}$') then
signal SQLSTATE VALUE '45000' SET MESSAGE_TEXT = 'Incorrect phone mask';
end if;
end if;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `students_AFTER_INSERT` AFTER INSERT ON `students` FOR EACH ROW BEGIN
Set SQL_SAFE_UPDATES = 0;
INSERT INTO `kvant`.`pixels` (`id_student`) VALUES (new.idStudent);
Set SQL_SAFE_UPDATES = 1;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `students_BEFORE_UPDATE` BEFORE UPDATE ON `students` FOR EACH ROW BEGIN
IF(new.phone != '') then
If( new.phone not regexp '^((8|\\+7|7)[\\- ]?)?(\\(?\\d{3}\\)?[\\- ]?)?[\\d\\- ]{7,10}$') then
signal SQLSTATE VALUE '45000' SET MESSAGE_TEXT = 'Incorrect phone mask';
end if;
end if;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `students_BEFORE_DELETE` BEFORE DELETE ON `students` FOR EACH ROW BEGIN
Set SQL_SAFE_UPDATES = 0;
delete From `kvant`.`students_groups` where students_groups.idStudent = Old.idStudent;
delete From `kvant`.`participants_for_part_event` where participants_for_part_event.id_student = Old.idStudent;
delete From `kvant`.`pixels` where pixels.id_student = Old.idStudent;
Set SQL_SAFE_UPDATES = 1;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `students_groups`
--

DROP TABLE IF EXISTS `students_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students_groups` (
  `idStudent` int unsigned NOT NULL,
  `idGroup` int unsigned NOT NULL,
  PRIMARY KEY (`idStudent`,`idGroup`),
  KEY `Group_idx` (`idGroup`),
  CONSTRAINT `Group` FOREIGN KEY (`idGroup`) REFERENCES `groups` (`idGroups`),
  CONSTRAINT `Student` FOREIGN KEY (`idStudent`) REFERENCES `students` (`idStudent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `type_of_part_event`
--

DROP TABLE IF EXISTS `type_of_part_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_of_part_event` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `types_of_organization`
--

DROP TABLE IF EXISTS `types_of_organization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `types_of_organization` (
  `id_type` int unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `types_of_organization` (`id_type`, `name`) VALUES
  (1, 'Комплексный план'),
  (2, 'Гос. задние'),
  (3, 'Внешние');

--
-- Temporary view structure for view `view_schedule`
--

DROP TABLE IF EXISTS `view_schedule`;
/*!50001 DROP VIEW IF EXISTS `view_schedule`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_schedule` AS SELECT 
 1 AS `idlesson`,
 1 AS `room`,
 1 AS `group`,
 1 AS `startTime`,
 1 AS `endTime`,
 1 AS `day`,
 1 AS `name`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `weekday`
--

DROP TABLE IF EXISTS `weekday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weekday` (
  `idDay` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(11) NOT NULL,
  PRIMARY KEY (`idDay`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'kvant'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;
/*!50106 DROP EVENT IF EXISTS `cleanup_expired_tokens` */;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = utf8mb4 */ ;;
/*!50003 SET character_set_results = utf8mb4 */ ;;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `cleanup_expired_tokens` ON SCHEDULE EVERY 1 DAY STARTS '2026-02-17 11:27:57' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
  DELETE FROM refresh_tokens WHERE expires_at < NOW();
END */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

--
-- Dumping routines for database 'kvant'
--

--
-- Final view structure for view `full_profile`
--

/*!50001 DROP VIEW IF EXISTS `full_profile`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `full_profile` AS select `p`.`id` AS `id`,`p`.`employee_id` AS `employee_id`,concat(`e`.`second_name`,' ',`e`.`first_name`,' ',`e`.`patronymic`) AS `name`,`e`.`date_of_birth` AS `date_of_birth`,`pos`.`name` AS `position`,`e`.`contact` AS `contact`,`e`.`size` AS `size`,`e`.`education` AS `education`,`e`.`schedule` AS `schedule`,`e`.`gender` AS `gender` from ((`profile` `p` join `employees` `e`) join `position` `pos`) where ((`p`.`employee_id` = `e`.`id_employees`) and (`pos`.`id` = `e`.`position`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `view_schedule`
--

/*!50001 DROP VIEW IF EXISTS `view_schedule`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_schedule` AS select `schedule`.`idlesson` AS `idlesson`,`room`.`id` AS `room`,`groups`.`idGroups` AS `group`,`schedule`.`startTime` AS `startTime`,`schedule`.`endTime` AS `endTime`,`weekday`.`idDay` AS `day`,`employees`.`id_employees` AS `name` from (((((`schedule` left join `employees_schedule` on((`schedule`.`idlesson` = `employees_schedule`.`idSchedule`))) left join `employees` on((`employees_schedule`.`idEmployees` = `employees`.`id_employees`))) join `room`) join `groups`) join `weekday`) where ((`employees_schedule`.`room` = `room`.`id`) and (`schedule`.`group` = `groups`.`idGroups`) and (`schedule`.`day` = `weekday`.`idDay`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 15:00:50

LOCK TABLES `type_of_part_event` WRITE;
/*!40000 ALTER TABLE `type_of_part_event` DISABLE KEYS */;
INSERT INTO `type_of_part_event` VALUES (1,'региональный'),(2,'межрегиональный'),(3,'районый'),(4,'всероссийский'),(5,'междунородный');
/*!40000 ALTER TABLE `type_of_part_event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `weekday`
--

LOCK TABLES `weekday` WRITE;
/*!40000 ALTER TABLE `weekday` DISABLE KEYS */;
INSERT INTO `weekday` VALUES (1,'ВОСКРЕСЕНЬЕ'),(2,'ПОНЕДЕЛЬНИК'),(3,'ВТОРНИК'),(4,'СРЕДА'),(5,'ЧЕТВЕРГ'),(6,'ПЯТНИЦА'),(7,'СУББОТА');
/*!40000 ALTER TABLE `weekday` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'kvant'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;
/*!50106 DROP EVENT IF EXISTS `cleanup_expired_tokens` */;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = utf8mb4 */ ;;
/*!50003 SET character_set_results = utf8mb4 */ ;;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `cleanup_expired_tokens` ON SCHEDULE EVERY 1 DAY STARTS '2026-02-17 11:27:57' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
  DELETE FROM refresh_tokens WHERE expires_at < NOW();
END */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

LOCK TABLES `access_level` WRITE;
/*!40000 ALTER TABLE `access_level` DISABLE KEYS */;
INSERT INTO `access_level` VALUES (1,'root'),(2,'педагог'),(3,'гость'),(4,'руководитель'),(5,'педагог организатор'),(6,'админстратор');
/*!40000 ALTER TABLE `access_level` ENABLE KEYS */;
UNLOCK TABLES;