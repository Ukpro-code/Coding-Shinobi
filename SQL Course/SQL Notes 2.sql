# - Problem Statement: As a product owner. I want to generate a report of the individual product sales (aggregated on a monthly basis at the product code level) for Croma India customer for fy-2012 so that i can track individual product sales and run further product analytics on it in excel. 

# - The report should have the following fields 
# - 1. Month 
# - 2. Product name 
# - 3. Variant 
# - 4. Sold quantity 
# - 5. Gross profit per item 
# - 6. Gross price total 

# - User defined SQL functions 

# -To get fiscal year set as user defined function. 

# Goto functions add a fiscal year query #

# Create Function ‘get_fiscal_year’ (
#   Calendar_date Date )
# Returns Integer
#     Deterministic
#          Begin declare fiscal_year INT;
# Set Fiscal_Year= year(date_add(calendar_date, interval 4 months));
# Return fiscal_year;
# End;

# Takeaway 
#	- Date_Add function will help you to get a new data based on a given date by specifying the additional interval 
#	- Deterministic function means the output will be always the same for a given input 
#	- Not deterministic function means the output will differ depending upon the time of execution even with the same input. 

# - Exercise - User-defined SQL functions #;

select * from fact_sales_monthly
where customer_code= 90002002 and get_fiscal_year(date)=2021 order by date asc;

# Report for 2021 and Quater 4 
select*from fact_sales_monthly where get_fiscal_quater(date) = "q4" and customer_code = 90002002 order by date asc limit 1000;

# Takeaways # 
# - Business users generally analyse and cmpare the metrics based on quaters and fiscal_year
# - Create a function if you think a particular piece of code would be reused at multiple places. 

# Gross Sales Report - monthly product transactions # 

select s.date,s.product_code,p.product,p.variant,s. f from fact_sales_monthly s join dim_product p on p.product_code = s.product_code where