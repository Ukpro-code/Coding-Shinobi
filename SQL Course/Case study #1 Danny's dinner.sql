/* --------------------
   Case Study Questions
   --------------------*/

-- 1. What is the total amount each customer spent at the restaurant?
select s.customer_id, 
	sum(m.price) as total_spent 
from 
	sales s 
join 
	menu m on s.product_id = m.product_id
group by 
	s.customer_id;
-- 2. How many days has each customer visited the restaurant?
select customer_id, count(distinct order_date) as days_visited 
from sales 
group by customer_id; 
-- 3. What was the first item from the menu purchased by each customer?
select 
	s.customer_id,
    m.product_name,
    s.order_date
from 
	sales s
join 
	menu m on s.product_id = m.product_id
where 
	(s.customer_id, s.order_date) in ( 
		SELECT   
            customer_id,   
            MIN(order_date) AS first_order_date  
        FROM   
            sales  
        GROUP BY   
            customer_id   
		)
order by 
	s.customer_id;
-- 4. What is the most purchased item on the menu and how many times was it purchased by all customers?
select 
	m.product_name, count(s.product_id) as total_purchased 
from 
	sales s
join 
	menu m on s.product_id=m.product_id
group by 
	m.product_name 
order by 
	total_purchased desc;
-- 5. Which item was the most popular for each customer?
select 
	distinct s.customer_id, m.product_name, count(s.product_id) as most_popular 
from 
	sales s
join 
	menu m on s.product_id=m.product_id
group by 
	s.customer_id,m.product_name 
order by 
	most_popular desc;
-- 6. Which item was purchased first by the customer after they became a member?
-- 7. Which item was purchased just before the customer became a member?
-- 8. What is the total items and amount spent for each member before they became a member?
-- 9.  If each $1 spent equates to 10 points and sushi has a 2x points multiplier - how many points would each customer have?
-- 10. In the first week after a customer joins the program (including their join date) they earn 2x points on all items, not just sushi - how many points do customer A and B have at the end of January?

