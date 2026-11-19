import * as THREE from 'three';

export interface DetectiveCharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  ponytailPivot: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  skirtPivot: THREE.Group;
  contactShadow: THREE.Mesh;
  updateAnimation: (
    dt: number,
    elapsed: number,
    horizontalSpeed: number,
    isRunning: boolean,
    isGrounded: boolean,
    verticalVel: number,
    reducedMotion: boolean
  ) => boolean;
}

/**
 * Builds an articulated 3D third-person character for Ejen Nurin Maisarah:
 * - Dark green detective jacket with gold lapels, buttons & Detective Academy badge
 * - Crisp white collar & dark forest tie
 * - Tartan pleated detective skirt (with inner shorts) & leather boots
 * - High brown ponytail hair with natural physics sway
 * - Bottom-center pivot strictly grounded at y = 0
 */
export function createEjenNurinCharacter(
  contactShadowMap: THREE.Texture,
  isSoftwareGl: boolean,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T
): DetectiveCharacterRig {
  const root = new THREE.Group();

  // Contact grounding shadow directly at y = 0.025
  const contactShadow = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.1, 1.1)),
    trackMat(
      new THREE.MeshBasicMaterial({
        map: contactShadowMap,
        transparent: true,
        depthWrite: false,
        opacity: 0.56,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    )
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.025;
  root.add(contactShadow);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // Materials with deliberate roughness/metalness contrast
  const jacketMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x174c39, roughness: 0.62, metalness: 0.08 })
  );
  const darkGreenTrimMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x0e3426, roughness: 0.54, metalness: 0.14 })
  );
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe7c878, roughness: 0.24, metalness: 0.85 })
  );
  const shirtMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf7f5ee, roughness: 0.72, metalness: 0.02 })
  );
  const skirtMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x203b31, roughness: 0.78, metalness: 0.04 })
  );
  const skirtStripeMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xc9a34a, roughness: 0.68, metalness: 0.08 })
  );
  const skinMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf1c7a5, roughness: 0.65, metalness: 0.02 })
  );
  const hairMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x432a1d, roughness: 0.58, metalness: 0.08 })
  );
  const bootMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x241914, roughness: 0.38, metalness: 0.18 })
  );
  const eyeMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e1815, roughness: 0.2, metalness: 0.1 })
  );
  const satchelMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x6b4426, roughness: 0.55, metalness: 0.12 })
  );

  const makePart = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(trackGeo(geo), mat);
    m.castShadow = !isSoftwareGl;
    m.receiveShadow = !isSoftwareGl;
    return m;
  };

  // --- LEGS (Hip Y = 0.80) ---
  const buildLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.11, 0.8, 0);

    const thigh = makePart(new THREE.CapsuleGeometry(0.068, 0.24, 6, 10), skinMat);
    thigh.position.y = -0.17;
    hip.add(thigh);

    // Knee sock top cuff
    const knee = new THREE.Group();
    knee.position.set(0, -0.36, 0);
    hip.add(knee);

    const sock = makePart(new THREE.CylinderGeometry(0.056, 0.046, 0.26, 10), shirtMat);
    sock.position.y = -0.14;
    knee.add(sock);

    const bootShaft = makePart(new THREE.CylinderGeometry(0.056, 0.054, 0.14, 10), bootMat);
    bootShaft.position.y = -0.31;
    knee.add(bootShaft);

    const bootFoot = makePart(new THREE.BoxGeometry(0.11, 0.08, 0.22), bootMat);
    bootFoot.position.set(0, -0.4, 0.04);
    knee.add(bootFoot);

    return { hip, knee };
  };

  const leftLegRig = buildLeg(-1);
  const rightLegRig = buildLeg(1);
  bodyPivot.add(leftLegRig.hip, rightLegRig.hip);

  // --- PELVIS & PLEATED DETECTIVE SKIRT ---
  const skirtPivot = new THREE.Group();
  skirtPivot.position.set(0, 0.86, 0);
  bodyPivot.add(skirtPivot);

  const waistBand = makePart(new THREE.CylinderGeometry(0.175, 0.185, 0.07, 14), darkGreenTrimMat);
  waistBand.position.y = 0.02;
  skirtPivot.add(waistBand);

  const skirtCone = makePart(new THREE.CylinderGeometry(0.18, 0.31, 0.34, 16), skirtMat);
  skirtCone.position.y = -0.16;
  skirtPivot.add(skirtCone);

  const skirtGoldHem = makePart(new THREE.CylinderGeometry(0.305, 0.315, 0.028, 16), skirtStripeMat);
  skirtGoldHem.position.y = -0.31;
  skirtPivot.add(skirtGoldHem);

  // Inner dark shorts so upward angles never expose clipping
  const innerShorts = makePart(new THREE.CylinderGeometry(0.16, 0.17, 0.14, 12), darkGreenTrimMat);
  innerShorts.position.y = -0.09;
  skirtPivot.add(innerShorts);

  // --- TORSO & DARK GREEN DETECTIVE JACKET ---
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.89, 0);
  bodyPivot.add(torsoGroup);

  // Blazer torso
  const torso = makePart(new THREE.CylinderGeometry(0.195, 0.165, 0.44, 14), jacketMat);
  torso.position.y = 0.22;
  torso.scale.set(1.06, 1, 0.72);
  torsoGroup.add(torso);

  // White shirt V-placket + tie at front (+Z is forward? Wait: make -Z forward so character faces away from chase camera cleanly!)
  // Convention: character faces +Z in local space; when placed in world with rotation.y = PI she faces -Z!
  // Let's keep character facing +Z in local space consistently.
  const shirtV = makePart(new THREE.BoxGeometry(0.12, 0.22, 0.04), shirtMat);
  shirtV.position.set(0, 0.32, 0.13);
  torsoGroup.add(shirtV);

  const tie = makePart(new THREE.BoxGeometry(0.045, 0.18, 0.02), darkGreenTrimMat);
  tie.position.set(0, 0.29, 0.145);
  torsoGroup.add(tie);

  // Gold lapel trim & jacket buttons (back + front visible)
  const collarRing = makePart(new THREE.TorusGeometry(0.13, 0.025, 8, 16), goldMat);
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.set(0, 0.43, 0);
  torsoGroup.add(collarRing);

  const goldShoulderTrimL = makePart(new THREE.BoxGeometry(0.13, 0.03, 0.08), goldMat);
  goldShoulderTrimL.position.set(-0.21, 0.43, 0);
  torsoGroup.add(goldShoulderTrimL);

  const goldShoulderTrimR = makePart(new THREE.BoxGeometry(0.13, 0.03, 0.08), goldMat);
  goldShoulderTrimR.position.set(0.21, 0.43, 0);
  torsoGroup.add(goldShoulderTrimR);

  // Back jacket seam & gold waist strap (visible prominently in 3rd-person view!)
  const backBelt = makePart(new THREE.BoxGeometry(0.32, 0.045, 0.26), darkGreenTrimMat);
  backBelt.position.set(0, 0.05, 0);
  torsoGroup.add(backBelt);

  const backGoldBuckle = makePart(new THREE.BoxGeometry(0.14, 0.03, 0.03), goldMat);
  backGoldBuckle.position.set(0, 0.05, -0.135);
  torsoGroup.add(backGoldBuckle);

  // Front buttons + Detective Academy chest badge
  [0.14, 0.22, 0.3].forEach((by) => {
    const btn = makePart(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8), goldMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0, by, 0.145);
    torsoGroup.add(btn);
  });

  const badge = makePart(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 6), goldMat);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0.1, 0.32, 0.145);
  torsoGroup.add(badge);

  // Crossbody leather detective satchel
  const satchelBag = makePart(new THREE.BoxGeometry(0.08, 0.18, 0.2), satchelMat);
  satchelBag.position.set(0.2, 0.02, -0.02);
  torsoGroup.add(satchelBag);
  const satchelClasp = makePart(new THREE.BoxGeometry(0.02, 0.04, 0.04), goldMat);
  satchelClasp.position.set(0.24, 0.03, -0.02);
  torsoGroup.add(satchelClasp);

  // --- ARMS (Shoulder Y = 0.40 on torso) ---
  const buildArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.23, 0.4, 0);

    const upperArm = makePart(new THREE.CapsuleGeometry(0.052, 0.18, 6, 8), jacketMat);
    upperArm.position.y = -0.12;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.25, 0);
    shoulder.add(elbow);

    const forearm = makePart(new THREE.CapsuleGeometry(0.045, 0.16, 6, 8), jacketMat);
    forearm.position.y = -0.1;
    elbow.add(forearm);

    const cuff = makePart(new THREE.CylinderGeometry(0.048, 0.048, 0.035, 10), goldMat);
    cuff.position.y = -0.18;
    elbow.add(cuff);

    const hand = makePart(new THREE.SphereGeometry(0.044, 8, 8), skinMat);
    hand.position.y = -0.22;
    elbow.add(hand);

    return { shoulder, elbow };
  };

  const leftArmRig = buildArm(-1);
  const rightArmRig = buildArm(1);
  torsoGroup.add(leftArmRig.shoulder, rightArmRig.shoulder);

  // --- HEAD & HIGH BROWN PONYTAIL ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.48, 0);
  torsoGroup.add(headGroup);

  const neck = makePart(new THREE.CylinderGeometry(0.058, 0.068, 0.1, 10), skinMat);
  neck.position.y = 0.02;
  headGroup.add(neck);

  const head = makePart(new THREE.SphereGeometry(0.17, 16, 14), skinMat);
  head.position.y = 0.2;
  head.scale.set(0.96, 1.03, 0.96);
  headGroup.add(head);

  // Eyes (+Z front face)
  [-0.06, 0.06].forEach((ex) => {
    const eye = makePart(new THREE.SphereGeometry(0.021, 8, 8), eyeMat);
    eye.position.set(ex, 0.21, 0.15);
    headGroup.add(eye);
  });

  // Hair cap & bangs
  const hairCrown = makePart(new THREE.SphereGeometry(0.182, 16, 14), hairMat);
  hairCrown.position.set(0, 0.23, -0.02);
  hairCrown.scale.set(1.02, 1.0, 1.04);
  headGroup.add(hairCrown);

  const bangsL = makePart(new THREE.BoxGeometry(0.11, 0.08, 0.08), hairMat);
  bangsL.position.set(-0.08, 0.3, 0.12);
  bangsL.rotation.z = 0.25;
  headGroup.add(bangsL);

  const bangsR = makePart(new THREE.BoxGeometry(0.11, 0.08, 0.08), hairMat);
  bangsR.position.set(0.08, 0.3, 0.12);
  bangsR.rotation.z = -0.25;
  headGroup.add(bangsR);

  // Gold hair tie + Articulated swaying Ponytail (hero 3rd-person visual!)
  const hairScrunchie = makePart(new THREE.TorusGeometry(0.048, 0.016, 6, 12), goldMat);
  hairScrunchie.position.set(0, 0.32, -0.16);
  hairScrunchie.rotation.x = Math.PI / 3;
  headGroup.add(hairScrunchie);

  const ponytailPivot = new THREE.Group();
  ponytailPivot.position.set(0, 0.32, -0.17);
  headGroup.add(ponytailPivot);

  const ponyUpper = makePart(new THREE.ConeGeometry(0.078, 0.24, 10), hairMat);
  ponyUpper.position.set(0, -0.1, -0.06);
  ponyUpper.rotation.x = Math.PI - 0.38;
  ponytailPivot.add(ponyUpper);

  const ponyLower = makePart(new THREE.ConeGeometry(0.056, 0.26, 10), hairMat);
  ponyLower.position.set(0, -0.27, -0.11);
  ponyLower.rotation.x = Math.PI - 0.16;
  ponytailPivot.add(ponyLower);

  // Animation state
  let stridePhase = 0;
  let lastStepHalf = 0;
  let idleBlend = 1;
  let runBlend = 0;
  let airBlend = 0;

  const updateAnimation = (
    dt: number,
    elapsed: number,
    horizontalSpeed: number,
    isRunning: boolean,
    isGrounded: boolean,
    verticalVel: number,
    reducedMotion: boolean
  ): boolean => {
    let triggeredFootstep = false;
    const moving = horizontalSpeed > 0.35;
    const targetIdle = moving ? 0 : 1;
    const targetRun = moving && isRunning ? 1 : 0;
    const targetAir = isGrounded ? 0 : 1;

    const blendAlpha = reducedMotion ? 1 : 1 - Math.exp(-12 * dt);
    idleBlend = THREE.MathUtils.lerp(idleBlend, targetIdle, blendAlpha);
    runBlend = THREE.MathUtils.lerp(runBlend, targetRun, blendAlpha);
    airBlend = THREE.MathUtils.lerp(airBlend, targetAir, blendAlpha);

    if (moving && isGrounded) {
      const rate = isRunning ? 12.2 : 8.2;
      stridePhase += dt * rate;
      const halfCount = Math.floor(stridePhase / Math.PI);
      if (halfCount !== lastStepHalf) {
        lastStepHalf = halfCount;
        triggeredFootstep = true;
      }
    }

    if (reducedMotion) {
      bodyPivot.position.y = 0;
      torsoGroup.rotation.set(0, 0, 0);
      leftLegRig.hip.rotation.set(0, 0, 0);
      rightLegRig.hip.rotation.set(0, 0, 0);
      leftLegRig.knee.rotation.set(0, 0, 0);
      rightLegRig.knee.rotation.set(0, 0, 0);
      leftArmRig.shoulder.rotation.set(0, 0, 0.08);
      rightArmRig.shoulder.rotation.set(0, 0, -0.08);
      ponytailPivot.rotation.set(0, 0, 0);
      return triggeredFootstep;
    }

    const s = Math.sin(stridePhase);
    const c = Math.cos(stridePhase);
    const swingAmp = THREE.MathUtils.lerp(0.55, 0.92, runBlend) * (1 - idleBlend);
    const armAmp = THREE.MathUtils.lerp(0.45, 0.85, runBlend) * (1 - idleBlend);

    // Legs & Knees
    const jumpLegTilt = THREE.MathUtils.clamp(-verticalVel * 0.06, -0.35, 0.4) * airBlend;
    leftLegRig.hip.rotation.x = s * swingAmp * (1 - airBlend) + jumpLegTilt;
    rightLegRig.hip.rotation.x = -s * swingAmp * (1 - airBlend) - jumpLegTilt * 0.7;

    leftLegRig.knee.rotation.x =
      (Math.max(0, -c) * 0.72 * (1 - idleBlend)) * (1 - airBlend) + airBlend * 0.42;
    rightLegRig.knee.rotation.x =
      (Math.max(0, c) * 0.72 * (1 - idleBlend)) * (1 - airBlend) + airBlend * 0.25;

    // Arms & Elbows
    leftArmRig.shoulder.rotation.x = -s * armAmp * (1 - airBlend) - airBlend * 0.45;
    rightArmRig.shoulder.rotation.x = s * armAmp * (1 - airBlend) - airBlend * 0.45;
    leftArmRig.shoulder.rotation.z = 0.08 + idleBlend * 0.03;
    rightArmRig.shoulder.rotation.z = -0.08 - idleBlend * 0.03;
    leftArmRig.elbow.rotation.x = -0.22 - runBlend * 0.55 - (1 - idleBlend) * 0.12;
    rightArmRig.elbow.rotation.x = -0.22 - runBlend * 0.55 - (1 - idleBlend) * 0.12;

    // Body bob, breathing & forward lean when running
    const walkBob = Math.abs(c) * 0.055 * (1 - idleBlend) * (1 - airBlend);
    const idleBreath = Math.sin(elapsed * 2.1) * 0.012 * idleBlend;
    bodyPivot.position.y = walkBob + idleBreath;

    torsoGroup.rotation.x = runBlend * 0.16 + (1 - idleBlend) * 0.05;
    torsoGroup.rotation.y = s * 0.06 * (1 - idleBlend);
    headGroup.rotation.x = -torsoGroup.rotation.x * 0.65 + Math.sin(elapsed * 1.4) * 0.02 * idleBlend;

    // Skirt subtle flare with legs
    skirtPivot.rotation.x = Math.abs(s) * 0.05 * (1 - idleBlend);

    // Ponytail sway
    const hairBounce = Math.abs(s) * 0.14 * (1 - idleBlend) + Math.sin(elapsed * 2.6) * 0.035;
    ponytailPivot.rotation.x = 0.08 + runBlend * 0.24 + hairBounce;
    ponytailPivot.rotation.z = s * 0.09 * (1 - idleBlend) + Math.sin(elapsed * 1.9) * 0.04;

    // Contact shadow softens slightly during jump
    contactShadow.scale.setScalar(1 - airBlend * 0.25);

    return triggeredFootstep;
  };

  return {
    root,
    bodyPivot,
    torsoGroup,
    headGroup,
    ponytailPivot,
    leftShoulder: leftArmRig.shoulder,
    leftElbow: leftArmRig.elbow,
    rightShoulder: rightArmRig.shoulder,
    rightElbow: rightArmRig.elbow,
    leftHip: leftLegRig.hip,
    leftKnee: leftLegRig.knee,
    rightHip: rightLegRig.hip,
    rightKnee: rightLegRig.knee,
    skirtPivot,
    contactShadow,
    updateAnimation,
  };
}
