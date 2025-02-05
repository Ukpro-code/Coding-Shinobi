use moviesdb;
/* Retrieve Data using text query (select, where, Distinct, Like) practice */
select * from movies;
select * from movies where industry = "hollywood";
select count(*) from movies where industry = "bollywood";
select distinct industry from movies;

/* Take away 
- Select from and where are basic functions 
- '*' means all columns , using it after select query will slect all columns of a database
- With the help of the USE function , you can introduce the query to use a particular database, especially whne there are Multiple databases
- The COUNT function will provide the numerical count of rows
- The DISTINCT function will help you see the unique value present in the given column 
- " % " is a wild card search, Use LIKE function and % to filter rpws based on text value*/

/*  Practice Print all movie titles and release year for all Marvel Studios movies */ 
select title , release_year from movies where studio like "%marvel%";
/* Parctice Print all movies that have Avenger in their name */ 
select * from movies where title like "%avenger%";
/* Practice Print the year in which "The Godfather" move was released */
select release_year from movies where title ="the godfather";
/* Practice Print all distinct movie studios on Bollywood industry*/
select distinct studio from movies where industry = "bollywood";

/* Retrieve Data using Numeric Query (Between , in, Order By, limit, offset) */
select * from movies where imdb_rating >=9; /* filter moview with rating */
select * from movies where imdb_rating <=9 and imdb_rating >=5;
select * from movies where imdb_rating between 5 and 8;  /* using between operator is better*/
select * from movies where release_year = 2022 or release_year = 2018; /* using OR operator*/
select * from movies where studio in ("marvel studios" , "zee studios"); /* Using IN operators*/
select * from movies where imdb_rating is null;  /*Using NULL operator*/
select * from movies where imdb_rating is not null;  /*Using not NULL operator*/
select * from movies where industry = "Bollywood" Order by imdb_rating ; /* Using Order By "DESC" and "Asc"ending order is the default"*/
select * from movies where industry = "Bollywood" Order by imdb_rating desc limit 5; /* Limit Clause*/
select * from movies where industry = "Bollywood" Order by imdb_rating desc limit 5 offset 0; /* Offset Clause*/
/* Takeaways 
- <, >, <=, >=, are basic operators used in SQL.
- You can also use AND, Between, IN to perform numerical queries 
- you can start the table by using orderby clause
- Limit Clause can be used to fetch the top N or Bottom N amounts of reocrds N can be any numerical values
- Offset Caluse will help you to skip a certain number of rows in your final result */

/* Practice */
/*Print all movies in the order of their release year (latest first)*/
Select * from movies order by release_year desc;
/*All movies released in the year 2022*/
select * from movies where release_year = 2022;
/* Now all the movies released after 2020*/
select * from movies where release_year >= 2020;
/*All movies after the year 2020 that have more than 8 rating*/
Select * from movies where release_year >= 2020 and imdb_rating >8;
/*Select all movies that are by Marvel studios and Hombale Films*/
Select * from movies where studio in ("Marvel Studios", "Hombale Films");
/*Select all THOR movies by their release year*/
select * from movies where title like "%thor%" order by release_year;
/*Select all movies that are not from Marvel Studios*/
select * from movies where studio != "marvel studios";

/* Summary Analysis (Min, Max, Avg, Groupby)*/
select max(imdb_rating) from movies where industry = "hollywood";
select avg (imdb_rating) from movies where industry = "hollywood";
select round(avg(imdb_rating),2) from movies where industry = "hollywood";/* round the decimal point by 2*/
select max(imdb_rating) as max , round(avg(imdb_rating),2) as avg , min(Imdb_rating) as min from movies where industry = "hollywood";
Select industry, count(*) from movies group by industry;  
Select studio , count(*) as cnt from movies group by studio order by cnt desc;  

/* Takeaway 
- knowing summary analytics will enable you to perform ad hoc analysis which is an important use case
- Max. Min and Avg are common summary anaytics of SQL also count ()
- you can define a custom column header name by using "as" clause
- Group by clause will help you create a summary of metrics such as avg, count, etc for selected columns*/

/* Practice */
/*How many movies were released between 2015 and 2022*/
select count(*) as cnt  from movies where release_year between 2015 and 2022; /* count 16 movies*/ 
/*Print the max and min movie release year*/
select max(release_year), min(release_year) from movies;
/*Print a year and how many movies were released in that year starting with the latest year*/
select release_year, count(*) as cnt from movies group by release_year order by cnt desc; 

/* Having Clause*/
# Print all the year where more than 2 movies were released 
# excecution pattern of SQL From --> Where --> Group by --> Having --> order by
# Group by and having clauses are often used together 
# the column you use in having should be present in select clause whereas where can use columns that is not in the select clause as well

select release_year, count(*)as cnt from movies  group by release_year having cnt >2 order by cnt desc;  

# Calculated columns (If, Case, Year, Curyear)
# Using Actor table as example 
select year (curdate());
select *, year(curdate()) - birth_year as age from actors;

#Using Financial Tables 
# Calculating profit
select *, (revenue-budget) as profit from financials;

#converting into inr or unit conversion 

select *, if(currency = 'USD',revenue*86,revenue) as revenue_inr from financials;
#for unit conversion 
select distinct unit from financials; 
select *, case when unit ='thousands' then revenue/1000 when unit = 'billions' then revenue*1000 else revenue end as revenue_mln from financials;

# takeway # 
# you can derive new colums from the exisiting column in a table
# as a data analyst revenue and profit are the most common metric that you will calculate in the industry 
# Currency conversion and unit conversion are important business use cases of sql 
# If function is also often used in SQL Queries 
# when you have more than two conditions , you need to use case and end function instead of if function 

# PRACTICE #
# Print Profit percentage for all the movies 
select *, (revenue-budget) as profit, (revenue-budget)*100/budget as profit_pct from financials;

# Must remeber from QUiz #
# State whether the below statement is True or False. The columns used in the GROUP BY clause must be present in the Select clause. Answer False ,  
# Why False? In SQL, when using the GROUP BY clause, the columns specified do not necessarily have to be included in the SELECT clause. However, any column in the SELECT clause that is not used with an aggregate function must be part of the GROUP BY clause.

# why Do we need multiple tables? to organise and have a structured data collection and mapping data effectively

# SQL Joins( Inner , left, Right and full ) # most sql interview topic so better be through with it #

#Inner Join 
# - What is Inner Join? SQL by default does inner join when used JOIN function. 
# - Join takes only common records from tables joined
Select m.movie_id,title,budget,revenue,currency,unit from movies m join financials f on m.movie_id=f.movie_id;

#Left Join 
# - Returns only the common values and related values from left table. Check Venn Diagram for better understanding. 
Select m.movie_id,title,budget,revenue,currency,unit from movies m left join financials f on m.movie_id=f.movie_id;

#Right Join
# - Returns value from the right table including the common values. check Venn diagram for batter understanding
Select m.movie_id,title,budget,revenue,currency,unit from movies m right join financials f on m.movie_id=f.movie_id;

#Full join 
# - Returns all values from all the tables joined. check venn disgram for better understanding. Use Keyword "Union" for between both Left and Right join Query. 
Select m.movie_id,title,budget,revenue,currency,unit from movies m left join financials f on m.movie_id=f.movie_id Union Select f.movie_id,title,budget,revenue,currency,unit from movies m right join financials f on m.movie_id=f.movie_id;

# left, right and full join are called outer join function in SQL
# "Using" Clause on join function  
Select movie_id,title,budget,revenue,currency,unit from movies m right join financials f using (movie_id);

# Takeaway #
# - Join and ON Clause used together will enable you to merge two tables 
# - Join, On and And Clause will enable you to merge two tables based on multiple columns 
# - There is an export button in SQL editor through which you can download results as .csv file 
# - You can assign an abbreviated letter next to the table name to shorten the query length 
# - There are multiple kinds JOin is SQL : INNER, LEFT, RIGHT FULL AND CROSS JOIN(More about cross join later below)
# - By defualt SQL will perform an inner join
# - UNION Clause will enable you to perform full join function 

 # Practice # 
# Show all movies with their language names ?
select m.title, l.name from movies m join languages l using (language_id);
# Show all telugu movie names (assuming you don't know the language id for telugu movies)
SELECT title from movies m LEFT JOIN languages l ON m.language_id=l.language_id Where l.name="Telugu";
# Show the language and number of movies released in that language 
Select l.name, count(m.movie_id) as No_of_Movies from languages l left join movies m Using (language_id) group by language_id order by No_of_Movies Desc;

# Cross Join # using food_db
Select * from food_db.items cross join food_db.variants;
# to concate the variant and name in new colummn
select *, concat(name, '-', variant_name) as full_name, (Price+variant_price) as full_price from food_db.items cross join food_db.variants;

# Takeaway #
# - Concatenation Or CONCAT() means combinng two strings together 
# - Knowing Excel will help in better understanding of SQL. 
# - Cross Join is useful when you do not have any common column between two tables. 

# Analytics On Tables 
select m.movie_id,Title,budget,revenue,currency,unit, (Revenue-budget)as profit from movies m Join financials f on m.movie_id = f.movie_id; 
# Takeaway #
# - you would need to merge the tables often to create meaningful insights for businesses
# - Spend time to understand JOIN Thoroughly as you will use it a lot in SQL 
# - Finding Top N/Bottom N is another common use case in businesses which you can achieve by order By 

# To Join more than two tables 
#  - Use enity relationship diagram using websites like dbdiagram.io where you can create these diagrams
# - Used the above to visually understand the structure of the table. Use note and paper also.

# to use all actors name in one column, movies on the other column and also include seperator 
select m.title, group_concat(a.name separator " || ") as actors from movies m join movie_actor ma on ma.movie_id = m.movie_id join actors a on a.actor_id = ma.actor_id group by m.movie_id;

# to use actor on one column and all the movies acted by actor on the other column
select a.name, group_concat(m.title separator " || ") as movies_acted, count(m.title) as movie_count from actors a join movie_actor ma on ma.actor_id = a.actor_id join movies m on m.movie_id = ma.movie_id group by a.actor_id order by movie_count desc;

# Takeaway #
# - whenever you get a requirement from a business stakeholder break the challenge down into simpler pieces before writing a query.
# - Group_concat() function will enable you to combine text from mulitple rows to one row. 

# Practice #
select Title,revenue,currency,unit, case when unit ='thousands' then round(revenue/1000,2) when unit = 'billions' then round(revenue*1000,2) else round(revenue,2) end as revenue_mln from movies m Join financials f on m.movie_id = f.movie_id join languages l on m.language_id = l.language_id where l.name= "Hindi" order by revenue_mln desc;
# practice case and end function using more examples and different databases

# subqueries 
# select a movie with highest imdb_rating
# this query returns single value 
Select * from movies where imdb_rating = (select max(imdb_rating) from movies);
# to return a list of values 
select * from movies where imdb_rating in ((select max(imdb_rating) from movies), (select min(imdb_rating) from movies));  
# A subquery retrun a table or no.of rows 
# Select all actors whose age>70 and <85
select* from (select name, year(curdate())-birth_year as age from actors) as actors_age where age>70 and age<85;

# Takeaway #
# - Subqueries are which generate output that will be used as input to the main query
# - Queries that provide a single record , list or even a table as output can be used as a subquery

# Any , All Operators 

# - Select actors who acted in any of these movies (101,110,121)
select * from actors where actor_id = any (Select actor_id from movie_actor where movie_id in(101,110,121));

# - Select all movies whose rating is greater than *any* of the marvel movies rating 
select*from movies where imdb_rating > Any(select min(imdb_rating) from movies where studio="Marvel studios"); 

# Takeaway #
# - In ,any and all clauses expect a list as input 
# - Any clause executes the condition for any one of the values on the list that meets the condition which is the minimum value by default 
# - All clause excecutes the condition where all the values on the list meet the condition which is the maximum value of the list

# - Select the actor_id, actor name and the total number of movies they acted in. 
# Using Corelated Subquery. 
Select actor_id,Name,(select count(*) from movie_actor where actor_id = actors.actor_id) as movie_count from actors order by movie_count desc;

# Takeaway #
# - A subquery is called a co related query when its execution depends upon the statements written after the bracket
# - one needs to choose between writing a subquery or a coelated query depending on its performance 
# - Explain analyze clause before any query will provide the query exceution plan through which one can understand the query performance. 

# Practice #
# - Select all the movies with minimum and maximum release_year. Note that there can be more than one movie in min and a max year hence output rows can be more than 2
select * from movies where release_year in ((select min(release_year) from movies),(select max(release_year) from movies));
# - Learn more about subquery practically in detail.   
# - Select all the rows from the movies table whose imdb_rating is higher than the average rating
Select *from movies where imdb_rating > (select avg(imdb_rating) from movies) order by imdb_rating desc;

# Common Table Expression # 

# Get all actors whose age is between 70 and 85 using common table expression 
with actors_age as ( select name as actor_name, year(curdate()) - birth_year as age from actors) select actor_name,age from actors_age where age >70 and age <85;

# Movies that produced 500% profit and their rating was less than avg rating for all movies 
# Break the problem statement into simple parts , combine the query using subquery and CTE. 
# using subquery example 
Select 
	x.movie_id,x.pct_profit,
    y.title,y.imdb_rating
from(select*, (Revenue-budget)*100/budget as pct_profit from financials) x
Join(Select * from movies where imdb_rating <(select avg(imdb_rating) from movies)) y
on x.movie_id = y.movie_id
where pct_profit >=500;

#using CTE example 
with x as (select*, (Revenue-budget)*100/budget as pct_profit from financials),
	y as (Select * from movies where imdb_rating <(select avg(imdb_rating) from movies))
Select x.movie_id, x.pct_profit,
		y.title,y.imdb_rating
from x join y on x.movie_id = y.movie_id where pct_profit >=500;

# Takeaway #
# - Common Table Expressions (CTE) creates a temporary table within a query 
# - with and as clause are used in combination to create CTE 
# - one can create multiple CTEs inside a query

# Benefits and Other Applications
# Benefits 
# - Simple Readable Queries
# - Same results can be refrenced multiple times , reusable queries 
# - Gives potential candiadtes for views , visbilty for creating data views(A data Transofrmed version of the table).
# - https://dev.mysql.com/doc/refman/8.0/en/with.html  (refer for recurrsive CTE)

# Practice #
# Select all Hollywood movies released after the year 2000 that made more than 500 million $ profit or more profit. Note that all Hollywood movies have millions as a unit hence you don't need to do the unit conversion. Also, you can write this query without CTE as well but you should try to write this using CTE only
# Select all Hollywood movies released after the year 2000 that made more than 500 million $ profit or more profit
with cte as (select title,release_year,(revenue-budget) as profit 
			from movies m join financials f on m.movie_id = f.movie_id
            where release_year>2000 and industry = "Hollywood")
select * from cte where profit>500;

# practice joins more efficiently with CTE to understand the concept more clearly 

# SQL data Types 
# - Numeric data types - whole numbers(INT) and numbers with decimal points(float). 
# - String Data Types - fixed length (Char) , variable length (VarChar), ENUM , Other types on mysql documentations page
# - Date and Time Data types - Date formats and time stamps 
# - Other data types - json(JavaScriptObjectNotation) data type for adding features without loosing space in database
# - Spatial Data types - used for spatial data like address, location etc. 

# Primary Key
# - for example movie_id,actor_id etc. from the above database is the primary key
# - Primary key is a unique identifier which cannot have any duplicates 
# - Primary key that already exists in databases is called natural key 
# - Primary Key that is generated by user artificially is called surrrogate key 
# - Composite key is a primary key that generated by combining multiple columns 
# - Auto increment option in schema setting will eneble you to auto assign numerical values on records incrementally 

 # Foreign key # 
 # - Foreign key is a way to establish relationship between two tables 
 # - the parent table contains the primary key which is connected to child table which contains the foreign key
 # - the key benefit of creating a relationship is to prevent having undesirable records in the database 
 # - By creating a relationship you can also update or delete records automatically in the child table based on the action you perform in the parent table.
 
# Insert Statement #
# - Syntax insert into table values(); 

# delete statement # 
# - Syntax Delete From Table where ();

# update Statement #
# - Syntas update table set columnname = values() where();

# Relational vs no SQL database 
# - Relational database - example oracle and ms sql server for enterprise level , my sql for small enterprise and practice 
# - no sql - Example MangoDB, couchdb , apache cassandra

# Profit and loss statement #
# - pre invoice deduction - Yearly discount made at the begining of each financial year combined by below three.  
# - Promotional offers 
# - Placement fees 
# - performance rebate 
# - COGS - Cost of goods sold 
# - Gross margin = netsales - cogs (also known as Gross margin of netsales)

# ETL, Datawarehouse, OLAP vs OLTP, Data catalog 
# - Sales software--> sometimes mysql, oracle, or excel 
# - CRM (Customer Relationship Manager) --> mysql , excel 
# above mentioned data are pushed to "Data warehouse" --> Example of Data warehouse  mysql, amazon redshift or teradata. 
# - ETL - Extract, Transform and Load perfomred before analysis to prepare the data. 
# - Done Data Engineer does ETL mostly. 
# - Tools like apache airflow, python , azure dat factory etc used for ETL. 
# - OLTP Online transaction processing 
# - PLAP - Online analytical processing 
# - Data catlog --> a centralised excel sheet with list of datbases with description and POC. 

# Fact vs Dimension Table star VS snowflake Schema,Data import #
# - Fact table is normalised , Dimension table can be denormalised. 




