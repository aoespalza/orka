SELECT c.id, c.code, c.status, c."finalValue", w.id as work_order_id, w."projectId", p.name as project_name 
FROM "Contract" c 
LEFT JOIN "WorkOrder" w ON c."workOrderId" = w.id 
LEFT JOIN "Project" p ON w."projectId" = p.id 
WHERE c.status = 'ACTIVE' 
ORDER BY p.name NULLS LAST 
LIMIT 10;