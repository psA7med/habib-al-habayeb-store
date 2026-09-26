import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())

// Handle Next.js server-only import in standalone test scripts
try {
  const serverOnlyPath = require.resolve("server-only")
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  } as any
} catch {}

let passedCount = 0
let failedCount = 0

function testAssert(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`)
    passedCount++
  } else {
    console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ""}`)
    failedCount++
  }
}

async function runStabilizationVerification() {
  const { db } = await import("../src/db")
  const { products, productVariants, categories, orders, orderLineItems, orderStatusHistory, siteSettings } = await import("../src/db/schema")
  const { eq, desc } = await import("drizzle-orm")
  const { dbProductRepository } = await import("../src/lib/repositories/db-product-repository")
  const { dbCategoryRepository } = await import("../src/lib/repositories/db-category-repository")
  const { dbOrderRepository } = await import("../src/lib/repositories/db-order-repository")
  const { createCodOrderAction } = await import("../src/app/(store)/checkout/actions")

  console.log("\n========================================================")
  console.log("🛒  HABIB AL-HABAYEB — STABILIZATION AUDIT VERIFICATION")
  console.log("========================================================\n")

  // ---------------------------------------------------------------------------
  // TEST 1: Database & Category Workflow
  // ---------------------------------------------------------------------------
  console.log("📁 1. Testing Category System & Database Query...")
  try {
    const allCategories = await dbCategoryRepository.list()
    testAssert("dbCategoryRepository.list() executes without errors", Array.isArray(allCategories))
    testAssert("Returns active categories from database", allCategories.length > 0)
    if (allCategories.length > 0) {
      const firstCat = allCategories[0]
      const fetched = await dbCategoryRepository.getBySlug(firstCat.slug)
      testAssert(`dbCategoryRepository.getBySlug('${firstCat.slug}') returns valid category`, fetched?.id === firstCat.id)
    }
  } catch (err: any) {
    testAssert("Category system verification", false, err.message)
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Product Workflow & Arabic Slugs
  // ---------------------------------------------------------------------------
  console.log("\n📦 2. Testing Product System & Arabic Slugs...")
  try {
    const prodsResult = await dbProductRepository.list()
    testAssert("dbProductRepository.list() executes without errors", Array.isArray(prodsResult.items))
    testAssert("Pagination metadata is accurate", prodsResult.pagination.total >= 0)

    // Test product slug resolution
    if (prodsResult.items.length > 0) {
      const sampleProd = prodsResult.items[0]
      const fetchedProd = await dbProductRepository.getBySlug(sampleProd.slug)
      testAssert(`dbProductRepository.getBySlug('${sampleProd.slug}') finds active product`, fetchedProd?.id === sampleProd.id)
    }
  } catch (err: any) {
    testAssert("Product system verification", false, err.message)
  }

  // ---------------------------------------------------------------------------
  // TEST 3: End-to-End Checkout -> Database -> Inventory
  // ---------------------------------------------------------------------------
  console.log("\n💳 3. Testing Checkout Flow & Live Order Creation...")
  try {
    // 1. Find an active product variant to test ordering
    const [testVariant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.isActive, true))
      .limit(1)

    if (!testVariant) {
      throw new Error("No active product variant available for checkout test.")
    }

    const initialQuantity = testVariant.quantity
    const testOrderQty = 1

    // 2. Execute createCodOrderAction
    const checkoutResult = await createCodOrderAction({
      fullName: "عميل تجريبي للتحقق",
      phone: "01012345678",
      email: "test-audit@habib.local",
      governorate: "أسيوط",
      city: "الغنايم",
      address: "شارع الجمهورية - بجوار المسجد الكبير",
      buildingFloorApt: "الدور الثاني",
      deliveryNotes: "يرجى الاتصال قبل الوصول",
      items: [
        {
          variantId: testVariant.id,
          quantity: testOrderQty,
        },
      ],
    })

    testAssert("createCodOrderAction returns success = true", checkoutResult.success === true)
    testAssert("Generates formatted order number (HAB-YYYY-XXXXXX)", checkoutResult.orderNumber.startsWith("HAB-"))
    testAssert("Returns valid orderId UUID", Boolean(checkoutResult.orderId))

    // 3. Verify order in PostgreSQL database
    const [dbSavedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, checkoutResult.orderId))
      .limit(1)

    testAssert("Order is saved in orders table in PostgreSQL", Boolean(dbSavedOrder))
    testAssert("Order status is set to 'pending'", dbSavedOrder?.status === "pending")
    testAssert("Payment method is 'cod'", dbSavedOrder?.paymentMethod === "cod")
    testAssert("Customer details preserved in Arabic", dbSavedOrder?.guestName === "عميل تجريبي للتحقق")

    // 4. Verify line items
    const lineItems = await db
      .select()
      .from(orderLineItems)
      .where(eq(orderLineItems.orderId, checkoutResult.orderId))

    testAssert("Order line item is saved with correct quantity", lineItems.length === 1 && lineItems[0].quantity === testOrderQty)

    // 5. Verify inventory decrement
    const [updatedVariant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, testVariant.id))
      .limit(1)

    const expectedQuantity = Math.max(0, initialQuantity - testOrderQty)
    testAssert(
      `Inventory correctly decremented from ${initialQuantity} to ${expectedQuantity}`,
      updatedVariant.quantity === expectedQuantity
    )

    // 6. Verify order status history audit trail
    const historyRows = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, checkoutResult.orderId))

    testAssert("Audit trail created in order_status_history", historyRows.length >= 1)

    // 7. Verify appearance in admin order repository list
    const adminOrdersList = await dbOrderRepository.list()
    const foundInAdminList = adminOrdersList.items.some((o) => o.id === checkoutResult.orderId)
    testAssert("Order appears in dbOrderRepository.list() for Admin panel", foundInAdminList)

  } catch (err: any) {
    testAssert("Checkout & inventory execution", false, err.message)
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Site Settings
  // ---------------------------------------------------------------------------
  console.log("\n⚙️  4. Testing Site Settings Data Access...")
  try {
    const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, "default")).limit(1)
    testAssert("Site settings query succeeds", Boolean(settings))
    testAssert("Store name is 'حبيب الحبايب'", settings?.storeName === "حبيب الحبايب")
  } catch (err: any) {
    testAssert("Site settings execution", false, err.message)
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n========================================================")
  console.log(`📊 STABILIZATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`)
  console.log("========================================================\n")

  if (failedCount > 0) {
    process.exit(1)
  }
}

runStabilizationVerification().catch((err) => {
  console.error("Verification error:", err)
  process.exit(1)
})
